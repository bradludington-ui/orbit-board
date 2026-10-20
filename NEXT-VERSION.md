# Next version — queued changes

Changes are logged here as they come up and built together as ONE version when Brad says **go**.
Nothing on this list touches the board until then. On go: build every open item, run the full
math gate once, bump the version once, push once, and move the items to *Shipped* with the version.

Current version: **v2.01**. Next: **v2.02**.

## Open

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

#### 89. Found while building v1.99: what a locked cycle still reads from today
- **Logged:** 6 Oct 2026, while building v1.99.
- **A locked cycle reads other lists from today (item 88's inventory).** Its view reads, as they are now: the destination
  list (`S.dest` holds keys into the board's one list), the bands (`MS.bands`), the BAE list (a budget set by rule is worked
  out against today's list; a chosen one is kept by name), and the appropriation's requirement data pack (the base titles
  and values of requirements the cycle never changed -- the pack changes only when an import brings a different one).
  Keeping them with the cycle the way item 88 keeps the RCN / EEIC list is the same kind of change; which of them matter
  is Brad's call. SI codes and PMOs are stored as codes and need nothing.
- **Brad, 6 Oct 2026 (for v2.00):** keeping these lists with the cycle has priority. Until it is done, say which of a locked
  cycle's classifications still read today's lists, and never claim the whole cycle is frozen. *(Item 98, v1.99: the
  PPBE cycles panel and Help say so.)*

#### 100. DoD security standards for the IL5 Azure environment — follows, pending the security team's answers
- The traceability table (NIST SP 800-53 Rev. 5, DISA ASD STIG, DoDI 8500.01, NIST SP 800-88 Rev. 1, CWE, MITRE ATT&CK),
  CUI markings on exports, and the control mapping depend on the security team's answers to the 15 deployment questions.
  Not in the v2.00 code build; it follows once they answer.

#### 101. The 1400px editors check measures before the drawer settles (logged 8 Oct 2026, for the next version)
- **Found** in the v2.00 gate (7 Oct, 7:11 PM ET): `tools/editors-reachable.mjs` reported the page 1px too wide at exactly
  1400px in the Segoe stand-in +6% run. Not reproduced in 13 repeat runs (7 on v2.00 `608444e`, 6 on v1.99 `6388472`), some
  under full sweep load; the whole browser stage passed on one re-run. Fonts are awaited first, so font loading is ruled out.
- **Likely cause:** the check measures once, a fixed 300 ms after clicking a row; at 1400px the RECORD panel opens as a
  drawer, and a reading taken before layout settles can catch a passing pixel.
- **Fix:** wait for layout to settle (two animation frames and equal back-to-back readings, or the drawer's
  `transitionend`) instead of the fixed 300 ms. Test tool only; the board does not change. Prove it: force the early
  reading (fails), then the settled one (passes).
- **Brad, 8 Oct 2026:** next version, not v2.00.

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

### v2.01 — 20 Oct 2026: what v2.00 left on its branch, D4-1, a readable RECORD panel and a longer PID -- built on Brad's "yes to all" of 20 Oct

**Why there is a v2.01.** PR #13 was merged on 19 Oct at `b71b18e`, a minute after it was opened. Eight commits then went
to `claude/orbit-v2.00` while the lead still read the PR as open, so `main` carried v2.00 without them -- among them the
nine Section 508 / WCAG 2.2 AA fixes Brad had asked to land before the merge, and the lockfile the OCIO POA&M (P-05) names
as done. v2.01 is those eight commits, unchanged, plus one fix. The menu and Section 508 work is described under v2.00
below ("UI menu — every top-right menu moves into the left menu"); every one of the eight is listed here by commit:

| Commit | What |
|---|---|
| `439716b` | Every top-right menu moves into the left menu, one home per action; `npm run leftmenu` |
| `91484f0` | The nine Section 508 / WCAG 2.2 AA findings closed (1.4.11, 2.5.8, 2.4.7, 1.4.10); the baseline stays at 0 |
| `b7de4a3` | The stale `build_prio_board.py` step for adding an appropriation goes; the generator is said to be retired (11 Sep 2026) |
| `bcc49cd` | The task bar's repeats of left-menu items go; the developer docs follow the left menu |
| `67bc4de` | Records only: the ledger names the U37, U44, U40 and UI commits by id |
| `30cdcdd` | `package-lock.json` pins the test tools (jsdom 27.4.0, playwright-core 1.63.0); `.gitignore` keeps it (OCIO P-05) |
| `3451746` | Codex D2-1: the save state and work kept aside are said to be at the foot of the left menu |
| `c6ba63f` | Codex D3-1: in a locked view, Install standard and Import ladder are refused up front, and no longer say they succeeded |

#### D4-1. A carriage return in a person's text reaches every export as a carriage return (Codex batch D4; Brad, 20 Oct: fix now)
- **What happened.** `_xesc`, which every workbook writer and the deck use, escaped `& < > "` and wrote a carriage return
  raw. XML allows the character, so U37 rightly does not refuse it -- but an XML reader turns a raw CR into a line feed
  before anything sees the text. A Plan Event typed as `carriage<CR>return` opened as `carriage<LF>return` in the Spend
  Plan Source (O&M Raw Data D2), the Priority Drill (1-N by Band E5), the deck (slide 5) and the workbook. ORBIT's own
  reader (`_xunesc`) kept the CR, so every round-trip test here passed. No dollar figure moved; only text that already held
  a CR, which comes from pasted or imported data.
- **The fix.** `_xesc` writes a CR as `&#13;` (decimal, which `_xunesc` decodes). Tabs and line feeds are unchanged.
- **The test.** `audit-recon.mjs`, "v2.01 (D4-1) — a carriage return in a Plan Event reaches every export as a carriage
  return, not a line feed": the Plan Event typed through the pen; `exportSrc`, `exportCSV`, `exportPPT` and `exportExcel`
  each run; the bytes each handed to its Blob unzipped and every part parsed with the page's DOMParser, as another program
  reads it; every text run holding the Plan Event must be the literal `carriage\rreturn`. On `c6ba63f` the four route
  checks fail (each reads `carriage\nreturn`); here all 11 pass. CONTROL: a Plan Event holding a line feed reads back as
  one on every route, on both.
- **Mutation:** `v201-d41-cr-raw` (the CR written raw again), caught by the block. 2,018 entries, each matching once.

#### 102. Nothing in the RECORD panel is unreadable (Brad, 20 Oct 2026, from a photo of the real board)
- **What he saw.** The By service table's UFR column printed `$252,035,0...` and a TOTAL of `$655,479,0...`: figures cut
  with an ellipsis in a fixed 78px column. Brad: "Let's fix so that there are no unreadable areas in the record panel."
- **What the new check found on `c245592`** (`tools/layout-fits.mjs` K, every requirement, 1920 / 1440 / 1366 / 1280 / 1024,
  every density, sliding over and docked, on a board with a BAE list and a requirement short by ten-digit figures): every
  UFR and lane-short figure wider than the column cut; the Req TOTAL cut beside its ↺; every BAE budget picker cutting the
  rule's name ("— the rule: USMC STOVL O&M -1A9A FL Discretionary P…") because it sat beside an 88px label column; and,
  with ten-digit values, the Req boxes cutting their own value.
- **The fix.**
  - A figure is one unbreakable span (`.fig`); the table's cells no longer clip, so the ↺ or a note wraps under the figure.
  - The UFR column is as wide as its widest figure (78px at least, as before).
  - `inspSplitFit()`: once the panel is drawn (every drawing ends with it), and on a resize or a change of the panel's
    width, the table's type steps down half a pixel until every box shows its whole value and every figure sits in its
    cell, never below 9px. Ordinary figures never shrink.
  - Each budget line is its label, then the picker across the panel, then clear.
- **The test.** K fails on `c245592` (45 findings, both passes) and passes here (300 records read, both passes). It reads
  what the browser drew: a panel that scrolls sideways, text clipped or ending in an ellipsis, text that spills out of its
  cell, anything past the panel's edge, a field that cuts its value, a picker that cuts the name it shows.

#### 103. A PID is up to 35 characters (Brad, 20 Oct 2026)
- `codeMax('pid')` is 35 (it was 20). The prompt reads the limit rather than restating it; Pre-flight's words say 35.
- **Test:** `audit-board.mjs` "v1.99 — a code longer than its limit …": 36 typed is refused, 35 taken; the prompt says 35; a
  file's 36-character PID is kept whole and listed, a 35-character one kept and not listed. Four of them fail on `c245592`.
- **Mutation:** `v201-pid-limit-20`, caught.

#### D5. Two U44 money CONTROLS nobody wrote (Codex batch D5, rebuilt here; Brad, 20 Oct: "run this one in full")
- **What they guard.** U44 fix round 6's part (h) counts a repeated destination's place past the keys of its own a list already
  holds (`held`) in two places no check reached: `destFold`'s snapshot of the board's own list, and `flowDelEnt`'s removal
  record. Both matter only when a board not yet put right has read part of another board's Put it right.
- **The scenario** (`audit-recon.mjs`, the U44 block): three boards on `7ee498a` each hold dA four times (Alpha Depot, Bravo
  Yard, Charlie Yard, Delta Dock); O&M package #1 goes to two managers. The first puts the list right, removes Charlie Yard
  and Delta Dock, and sends the work back; the consolidated board, not put right, takes it (Bravo Yard becomes "ddar1"). The
  second puts it right, puts R2 on one of the two removed, and sends it back. **SF2:** R2 on Charlie Yard comes across on
  Charlie Yard ("ddar2"), the workbook Alpha Depot 1,100, Charlie Yard 300, OGC 1,400. **S1:** the consolidated board first
  removes Delta Dock (kept under "ddar3"); R2 on Delta Dock comes back on Delta Dock, Delta Dock 300. Every figure by hand.
- **Departures from Codex's spec, each said in the test:** both managers are O&M (only an O&M return re-keys the consolidated
  board's own list; a Full Fund one would need a plan the block's fixtures do not build); S1 adds the consolidated board's
  own removal, without which `flowDelEnt`'s `held` is never read. A clone without `7ee498a` now fails by name rather than
  skipping both.
- **Proved:** the block passes 271 of 271 on the board; on `v200-u44-d5-remove-held-gone` only S1 fails, on
  `v200-u44-d5-fold-held-gone` only SF2 (each 270 of 271). 2,021 entries, each matching once.

#### The mutation sweep runs on Brad's named go (Brad, 20 Oct 2026)
- `mutate.mjs` stays text-only during development; a sweep runs only when Brad names one, on a committed tree, in saved
  batches, with nothing else running. Written into `CLAUDE.md` and `AGENTS.md`, which still said to run `npm run mutate`.
- `npm run validate:nightly` (`validate-math.mjs --no-sweep`) runs every other stage, and its pass line says the sweep was not
  run. The nightly Routine was rewritten to use it ("Nightly ORBIT math validation (no sweep)"): on 20 Oct it had ended its turn
  44 seconds into a full sweep of 2,021 targets.
- **Next sweep (Brad's plan):** the ~880 targets added in v2.00 and v2.01, once v2.01 is on `main`.

#### The checks v2.01 was proved with (20 Oct 2026, Eastern)
- `npm run validate:nightly` at `69a790c`, 10:08-11:00 AM: defect register (13 defects, 43 mutations), money coverage (26/26),
  money map (329 cells: 123 proven, 206 n/a, 0 open), trace matrix (92 cells), every suite (9 banners + the legacy line), fuzz
  (seed 575709290), the file verifier's self-test -- all clean; the browser checks' only failures are the 8 carried
  "D · first requirement on screen as it opens" (v2.00's named limit). The sweep was not run (the rule above).
- At `62443fe` (the last change to the board): `npm run verify:grid` (only the 8 carried D; layout-fits K clean), then keys,
  dropdowns, dialogs and leftmenu, which the chain stops before; `npm run standards`: 0 findings.

### v2.00 — 11 Oct 2026: item 99, built on Brad's "go" of 7 Oct -- the security version

**Imported text is drawn as text, and imported names cannot reach inside the program.** A security review of v1.99 for
Brad's security team confirmed 27 places where a value from an imported board, PMO package, QPE workbook or a peer's
folder file reached the page as HTML, so a crafted file could run its own script. Four later passes over the candidates
found more of the same kind and two related kinds; every one found is fixed in this candidate:

- a self-audit of the first candidate's diff (7 Oct) found 2 more injection sinks;
- a second audit (8 Oct) found 2 places where the first candidate escaped text that is not HTML, so "O&M" would have
  read "O&amp;M";
- a final review and a full sweep of the second candidate (8 Oct) found further raw sinks -- siblings of fixed ones, and
  others the earlier passes had missed -- and a label helper that escaped where the label is built;
- a key sweep (8-9 Oct) found that an imported or workbook name such as `__proto__`, `constructor` or `toString`, used
  as an object key, could write onto every object in the page, crash a panel, or drop dollars from a figure. On
  9 Oct Brad put that class in v2.00: one rule refuses those names as fields, ids and names at the import check and on
  typed input, and the maps that group workbook rows have no prototype;
- an independent re-verification of the key sweep's 63 candidates (10-11 Oct) found 14 of them still open on the
  fixed tree, and 10 siblings of the fixed ones. The rule now also covers the values the board uses as keys, and the
  remaining maps have no prototype.

Each fix has a check that fails on v1.99 and passes now (`audit-inject`, below). The cleanup Brad folded in -- section
banners, dead code out, the PowerPoint template fenced, stale comments -- changes no behaviour. Details and crafted files
are in the owner's private annex, outside the repo.

**What users may see:** nothing on a board this board wrote. Every figure, label and export reads as before, and text
with "&", "<" or quotes reads as typed. A file whose year or sequence fields hold text where a number belongs loads with
whole numbers. These files are now refused, and say why:

- a PMO package whose sequence is not a number, or that names an appropriation this board does not have;
- a file that carries a field, a requirement id, an office, service or band name, a submittal's office, or a
  destination key named after a built-in (`__proto__`, `constructor`, `toString`, `valueOf`, `hasOwnProperty` and the
  rest of what every object already answers to);
- a file whose id, key, office, service, appropriation or group value, wherever it sits, is one of those names, or
  whose requirement id begins with two underscores (the board keeps `__rem` and `__cut` for itself).

Put back refuses a journal path through one of those names. The import check reads a plan's ids and awards whether or
not the plan has an `order` list, including a store whose years are a list, and a data pack's requirements even when it
carries only its items. A typed office or service name follows the
rule an imported one does. A cost estimate is not filed under a built-in name. A Confluence download link is followed
only when it is a path on the configured host, and the companion link opens a file, a path or a web page, never a
script address. A board this board wrote carries none of the refused shapes, so every board people hold still opens.

**Expected changes to existing checks:** one check's pass rule changed, and the edits to existing checks follow it.

- **The v1.88 check in `audit-hostile` ("a file that could run code or change a figure is refused, whole, at every way
  in") asked that a file carrying keys named `toString`, `valueOf`, `hasOwnProperty` and `isPrototypeOf` pass the
  door.** v2.00's key rule refuses exactly those names, so the check now asks the opposite: each name, in a file of its
  own, is refused, and the reason names the field. A new control keeps the check's v1.88 purpose, that the door
  refuses no more than it must: keys that only look like those names (`ToString`, `valueOf_`, `hasOwnproperty`,
  `isPrototype`, `proto`, `__proto`, `Constructor`) pass. Corrected 11 Oct, after the earlier notes and commit said
  the suites passed (see "Validation record" below).
- 7 existing mutations were retargeted, because the lines they search for were rewritten:
  - `fydp-panel-position-hidden`, `delta-chip-on-unchanged`, `view-title-unmarked`, `view-header-unmarked` and
    `view-delete-on-screen`, for the label split;
  - `door-proto` and `door-constructor`, for the wider key rule. Each still removes exactly the name it is named for.
- validate-math's suites line no longer says "8 suites", and its comment now counts nine suites, eight of which print
  the banner.
- The sweep tries `audit-inject` first for a `v200-*` mutation that has no catcher on record (`FIRST_BY_PREFIX` in
  `mutate.mjs`), as it already did for a mutation whose catcher is on record. Order only: caught still means some suite
  failed, and a survivor must still pass every suite. With no catcher on record (a fresh checkout, as the gate runs),
  each of these mutations otherwise ran the seven suites above `audit-inject` before reaching it.

`audit-inject` joins `audit:suites` and the sweep's catching set. 135 mutations are added (1,139 to 1,274), each
matching its target exactly once.

GATE_V200

#### 99. Imported text shown as page code, plus the reviewability cleanup (Brad, 7 Oct 2026)
- **Found** reviewing v1.99 for Brad's security team: values from an imported board, PMO package, QPE workbook or a peer's
  folder file reach the page as HTML without escaping, so a crafted file can run its own script. 27 holes reproduced on
  v1.98 and v1.99 through the board's own import paths, audited, and shown running in Chromium. Details and crafted files
  are in the owner's private annex, outside the repo.
- **The fixes (as logged):** escape each value where it is shown; read year and sequence fields as numbers when they load;
  refuse `__proto__` / `constructor` / `prototype` as journal path elements, not only as object keys; validate custom ids
  and award keys even when a plan has no `order` list; allow-list the Confluence download host before attaching
  credentials. Do not make the import check refuse more than needed (boards people hold must keep opening).
- **The cleanup (folded in, Brad 7 Oct):** section headings so a reviewer can navigate the file; dead code removed; the
  1.6 MB PowerPoint template fenced with a recorded fingerprint so reviewers can skip it; misleading comments corrected.
- **Tests:** each confirmed hole becomes a check that fails on the pre-fix board and passes after; the security team
  verifies by running the suite and watching red turn green. A mutation removes each fix. One gate covers fixes and
  cleanup.
- **Self-audit (7 Oct 2026):** an independent adversarial pass over the first candidate's diff (four reviewers, each
  finding verified) found **two more injection sinks** the review's 27 had missed: an imported destination key drawn raw
  into the RECORD panel's "Goes to" / "Which awards to" options, and the funds-flow "counts as FY" input. Both fixed and
  covered.
- **Second audit (8 Oct 2026): escaping in the wrong place.** `esc()` is right only where text is drawn as HTML. The
  first candidate (`608444e`) escaped twice where text is not HTML: the funds-flow label was escaped when it was BUILT,
  so `O&M Carry` read `O&amp;M Carry` on the panel heading, in the chart and in the workbook's Scope line; and the
  budget-authority `confirm()` escaped the service names. Both fixed. `608444e` had passed its gate (8/8 stages,
  1,139/1,139 caught), but it gated a board with these defects, so it was superseded.
- **Final review and full sweep of the second candidate (`23a18ee`, 8 Oct 2026).** The gate run on `23a18ee` was stopped
  when the review found live sinks. Fixed in this candidate:
  - the package Cancel lines, which drew the appropriation name raw, beside the success line that escaped it; a package
    naming an appropriation this board does not have is now refused;
  - the CCaR import report's kept and no-FY counts, beside the escaped read count;
  - the BAE import's department list;
  - file names and error text in status lines (save in place, the QPE import);
  - the cost-estimate set names in the estimate note;
  - the writer's name, an award's service title, the cost-element tab, a row's team tag and the office filter's
    buttons;
  - counts that now read as whole numbers rather than escaped text: the CCaR records count in the Data menu, the roll
    panel's year count, and the cost-estimate line counts;
  - the companion link, which no longer opens a script address that ends in `.html`;
  - the reprogramming merge, which keyed rows by an imported id in a plain object;
  - the import check, which now reads a store whose years are a list;
  - typed office and service names, which now follow the import rule;
  - plain text that must not carry entities: the package conflict dialog, the journal search, the pre-flight copy, a cut
    requirement's title and the Put back question now decode markup to text (`diagPlain`) rather than show tags or
    entities.
  The cycle and position labels now come in two forms: `blLblTxt` / `ppLblTxt` give text for dialogs, file names,
  `document.title` and workbook cells, and `blLbl` / `ppLbl` escape it once for markup. The 35 places that escaped
  `blLbl` / `ppLbl` a second time no longer do.
- **Key sweep (8-9 Oct 2026); Brad put the class in v2.00 on 9 Oct.** An imported or workbook value used as a property
  name on an ordinary object can name something every object already has. Measured on the pre-fix head:
  - an execution row whose month cell read `__proto__` dropped $5,000 of $15,000 from the execution position;
  - a title of `__proto__` stopped the Execution panel and wrote `tot` and `obl` onto every object;
  - an estimate line naming service `__proto__` wrote onto `Object.prototype`;
  - a cost element named `constructor` stopped the cost-element panel;
  - a MIPR type named `constructor` would have exported the text `function Object() { [native code] }`;
  - a reprogramming entry with id `hasOwnProperty` broke every `hasOwnProperty.call` guard in the page;
  - a destination named `constructor` was re-pointed to the `Object` function and lost on the next save.
  Fixed by one rule and safe maps:
  - `IN_KEY_BAD` is now every name `Object.prototype` carries, plus `__proto__` and `prototype`, read from the browser
    itself;
  - the import check refuses those names as fields, as requirement ids (`inIdWhy`), as office, service and band names
    (`inNameWhy`), as a submittal's office, and as destination keys;
  - typed office and service names use the same `inNameWhy`, and a cost estimate is not filed under one;
  - 57 maps, on 50 lines, are created without a prototype (`Object.create(null)`): those that group workbook rows,
    estimate lines, cost elements, offices and destinations, and the MIPR list;
  - the saved estimate choice, a package's destination re-pointing and the cycle store are read by own key only.
  No board this board wrote uses any of these names, so every board people hold still opens.
- **Re-verification of the key sweep (10-11 Oct 2026).** Independent reviewers re-checked each of the 63 candidates
  against the fixed tree. 14 were still open, 1 was not a defect, and they found 10 siblings. Measured before the fix:
  - an office named `constructor` in a locked cycle stopped the five-year spend plan, the cycle comparison and the
    Spruills panel;
  - a data pack carrying only its items passed the import check, so an office named `__proto__` reached the office
    list; the forecast then wrote `tot` and `unsch` onto every object, and that office's ranking was never saved;
  - a CLIN key, an RCN/EEIC lookup, a funds-flow category and a PPBE position line named `__proto__` swapped a map's
    prototype or read the built-in;
  - an estimate line whose office was `constructor` read as claimed by an office, so the ACE tie-out left its
    $5,000,000 out of the TOTAL and out of the unclaimed lines, and the workbook said it did not tie without listing it;
  - the five-year spend plan workbook printed `function Object() { [native code] }` as an office's estimate;
  - a requirement id `__rem` collided with the plan walk's own bookkeeping, and the Two Spend Plans stopped;
  - the Execution panel opened an office named `__proto__` already expanded, and it could not be collapsed.
  Fixed in this candidate:
  - `IN_VAL_KEYS`: the import check refuses a built-in name as the value of an `id`, `nid`, `k`, `key`, `grp`, `pmo`,
    `svc` or `ap` field wherever it sits, and an id or `nid` beginning with two underscores;
  - a data pack holding only its items is checked as a requirement list;
  - the estimate office alignment, a destination map's targets and a submittal's office are checked;
  - the remaining maps keyed by an office, a group or a category have no prototype (the forecast, the five-year plan
    rows, the cycle comparison, the PMO matrix, the Execution panel's open rows, the ACE groups and shares, the
    Spruills projection, the tie-out's unclaimed lines);
  - the funds-flow sub-categories, the PPBE position values and the reprogramming merge's deletion marks are read by own
    key only.
- **Built:**
  - Every sink above, and each of the review's 27, escapes the value at the point it is drawn.
  - `wholeOr()` reads year and sequence fields as whole numbers on load (`MS.base` / `MS.cur`, a package ledger's
    sequences, a cycle's base). Buy quantities and counts are escaped where they are drawn, not converted on load.
  - `jrnlPathSafe` and the import check refuse a journal path through a built-in name.
  - `inShapeWhy` checks every year's plan, with or without an `order` list, in a store or a list of years.
  - `pkgApply` refuses a package whose sequence is not a number, or whose appropriation the board does not have.
  - `confSameHost` follows a Confluence download link only on the configured host.
  - `linkOpenable` opens only a file, a path or an http(s) page.
  - Reviewability: 42 section banners (§01–§42, anchored by function name). 21 unused functions and 2 unused variables
    removed. The PowerPoint template fenced and fingerprinted (`tools/tpl-parts.sha256`, checked by `check.mjs`). Stale
    comments corrected.
  - Tests: `tools/export-audit/audit-inject.mjs` holds checks for 44 findings plus 4 text-fidelity guards. They come in
    four kinds, and the suite's header says which is which: a runtime draw through the board's own renderer, a probe
    of a structural guard, a pin to the escaped form in the source for a sink deep inside a panel render (the hostile
    sweep does not plant those fields, so the pin is their only check), and the key checks K1–K8. Clean on this
    candidate.
  - Fail-before results:
    - **v1.99 (`6388472`):** all 44 finding checks fail. T3 and T4 also fail, because they pin the plain-text helpers
      v2.00 introduced; T1 and T2 pass there. That is 159 failing assertions in all.
    - **First candidate (`608444e`):** 23 finding checks and all 4 guards fail (127 assertions).
    - **Second candidate (`23a18ee`):** 22 finding checks, T3 and T4 fail (124 assertions).
    - **Head before the key-class fix (`2ed059d`):** the 8 key checks and the typed-name check fail (80 assertions).
  - 135 mutations (`v200-*`). Each one undoes one fix or re-adds one over-escape; a fix applied in several places
    through one function or rule is covered by mutating that function or rule. There are 1,274 mutation targets in
    all, each matching exactly once. Matching once makes a mutation applicable; it does not show that one is caught.
    The earlier notes said each `v200-*` was presweept against `audit-inject` alone and caught. At `1c94537` that was
    false for two: `audit-inject` passes with `v200-id-builtin-open` or `v200-spmt-pmo-open` applied, because the K1
    inputs for those rules sit in fields the value-key rule (`IN_VAL_KEYS`) also refuses. K1 now has two inputs that
    reach only those rules: a valueOf id in a plan's priority order, and a submittal whose office name carries markup.
  - **Validation record, corrected 11 Oct.** Commit `cdfc4ff` said `npm run audit:suites` passes. It did not: the
    full suites run on that tree failed (exit 1, 8 min 51 s, 1 failing check, the v1.88 `audit-hostile` check
    above), and the chain stopped there, so `audit-inject` did not run in it. The presweep was stopped and the gate
    not started (Brad, 11 Oct). Candidate `1c94537` is not gate-ready. Results for the corrected tree are recorded
    with its own commit, fresh.
- **Corrections to the notes written for the earlier candidates.** The final review found that they claimed more than
  the code and tests did. Corrected above:
  - buy quantities and counts were never converted on load;
  - not every fix had a check and a mutation (every fix in this candidate has both);
  - "23 checks fail on v1.99" counted failing assertions, not checks;
  - 21 functions and 2 variables were removed, not "about 23 functions";
  - validate-math's suites message had been edited;
  - the first candidate was gated with eight self-built runtime checks that proved nothing; they were removed in
    `23a18ee` on 8 Oct, before any later candidate was gated;
  - `blLbl` / `ppLbl` escaped where the label is built, which the notes called escaping where drawn.

#### R1–R5. Found by the review of `main` `f9b4413` (11 Oct 2026); fixes approved by Brad on 11 Oct

An outside review of `main` reported five findings (R1–R5) with runtime probes on synthetic data. Each was reproduced on
the v2.00 candidate and is fixed here, one finding per commit, each with a check that fails on the candidate, mutations
that remove the fix, and the review's own probe passing unchanged. These fixes were first built on 11 Oct and lost with
the session's environment before they were pushed; what is here was rebuilt from the recorded specifications, and every
result for it was run fresh against these commits.

- **R1 — the funds flow decides executed or planned by appropriation and EFFECTIVE fiscal year** (Codex review of `main`
  `f9b4413`; fix approved by Brad on 11 Oct). **What was wrong:** whether a year was executed or planned was decided by
  the year the CCaR workbook files a row under. The flow, though, counts each row in its effective year: with the OBBBA
  rule on, an FY25 O&M row whose Budget cell says OBBBA or Mandatory counts as FY26. Take a board whose only FY25 O&M row
  is a $100M OBBBA one. FY26 had no rows filed under it, so it was read as planned, and its $500M plan was counted beside
  the $100M carried into it: $600M. FY25 counted as executed with nothing left in it: $0. The panel called FY26
  "PLANNED, not executed" while it held executed money, and the export's TOTAL FUNDING read 600000000.
  **The fix:**
  - `flowExecYears(sl, raw)` decides executed years by effective year (`flowEffFy`). A year with execution counted in it
    is read from that execution and never also from its plan. A year left with no execution is a planned year.
  - The year buttons still offer the workbook's own years (`raw`). Without that, a saved FY25-only selection whose rows
    all count as FY26 would silently become all years. It stays FY25.
  - A total that holds planned and executed money is now said whenever the years in scope differ in kind, not only when
    one year holds both (v1.99, item 93). The panel says "Planned and executed money in one total" and the export adds
    "NOTE: planned and executed money in one total". Both use the same test (`flowIsMixed`) and the same wording, one
    line per year in scope (`flowMixLines`).
  - The matching rules no longer claim "select both years and the total is unchanged". They now say each row is counted
    once, in its effective year, and execution is never also read from the plan, so switching the rule on can change a
    two-year total.
  - Raw execution history (`EXDB.all`) is read, never rewritten.

  **The two approved cases:**
  - **Variant B** (FY25 plan $300M, FY26 plan $500M, one $100M FY25 OBBBA row): FY25 reads its $300M plan. FY26 reads
    $100M executed and $0 planned. Together they are $400M: $100M executed and $300M planned, labelled as both. The
    export shows US SERVICE FUNDING 400000000 and the planned-and-executed NOTE.
  - **Variant A** (the same plus a $40M ordinary FY25 row): FY25 = $40M executed and FY26 = $100M executed. Together
    they are $140M, all executed. The export agrees and carries no such NOTE.

  **What users may see:**
  - With the OBBBA rule on, FY26 O&M no longer adds its plan to the carried execution.
  - An FY25 whose rows all count as FY26 is marked "plan" and reads FY25's own plan. A two-year total changes to match
    (Variant B: $600M became $400M).
  - Any export whose years mix planned and executed money gains the NOTE, with a line per year in scope. That includes
    the everyday ALL YEARS view: FY25 executed, the later years planned.

  **Test:** `audit-recon.mjs`, scenario "v2.00 (R1) — execution precedence by appropriation and effective year", 19
  checks. The expected figures are the fixture's own arithmetic. The scenario covers:
  - both variants, one year at a time and both together;
  - the panel's mixed-total note, its year buttons and its planned-year note;
  - the export's Scope, US SERVICE FUNDING, O&M, TOTAL FUNDING and NOTE;
  - an FY25-only selection, saved and reopened;
  - raw history before and after;
  - the matching-rules wording.

  On `9b27e80`, 15 of the 19 checks fail. The two CONTROLs and the two raw-history guards pass. The review's
  `money-runtime-probe.mjs` goes from 10/13 to 13/13.

  **Mutations** (all in `audit-recon`): `v200-r1-raw-year-exec`, `v200-r1-saved-year-widens`,
  `v200-r1-mixed-disclosure-b`, `v200-r1-export-note` and `v200-r1-help-claim`. There are two new ones:
  `v200-r1-scan-stops-early` (the year scan stops too soon) and `v200-r1-mix-words-one-kind` (a year of one kind is
  written as both). Each applies exactly once and is caught by the R1 scenario. Every existing mutation still applies
  exactly once.

  **Limits:**
  - **Speed (corrected 11 Oct, after the adversarial review).** `flowExecYears` now reads rows rather than counting
    them. It stops once a year's two possible years are both marked, newest year first, so it is quick when FY26 rows are
    imported. With the OBBBA rule on and **no FY26 rows imported**, it reads every FY25 row on every one of the panel's
    ~150 year questions. On 4 appropriations × 2,000 FY25 rows (jsdom), a panel draw went from 273 ms to 847 ms (about
    3×) with no row carried, and from 312 ms to 792 ms with every row carried. With the plan window FY27–31 it went from
    159 ms to 709 ms. The first figure written here ("as fast as before, about 2× in one case") came from sets that
    always held FY26 rows, and understated it.
  - **Money completeness, for Brad's decision (found before this change, not changed by it).** A year that only
    carried rows count in -- outside the plan window and with no rows of its own -- is not offered as a year button, and
    the ALL YEARS total **leaves those carried dollars out, with nothing on screen or in the export saying so**. The
    adversarial review confirmed it. It is proposed to Brad as its own finding rather than folded into R1.
  - An FY25 that the board holds no plan for, whose rows all count as FY26, now reads **$0 planned** (labelled PLANNED,
    its chip marked plan). Before it read $0 executed. The first note here called this unchanged; the adversarial review
    showed it changed. No dollar figure changes: it is $0 either way.

  **Brad's decisions on R1 (11 Oct 2026), as built.** Brad's words: "For R1, keep the mixed-funding export NOTE whenever the
  selected total includes both executed and planned money, including all-years views. Replace any contradictory whole-total
  'PLANNED, not executed' box with accurate executed/planned amounts. Make the tooltip distinguish stored FY25 rows from their
  effective FY26 treatment."
  - **The money in the total decides the planned-and-executed note.** `flowIsMixed` now asks whether the selected total holds
    executed dollars and planned dollars (`F.execV` and `F.planV`, the figures the total is made of). Before, it asked whether
    the years in scope differ in kind. The panel's "Planned and executed money in one total" box and the export's "NOTE:
    planned and executed money in one total" both use this test, in every scope, including ALL YEARS.
    - Kept: an ALL YEARS view with FY25 executed ($40M) and FY26 planned ($500M) carries the NOTE and the box, with a line per
      year.
    - No longer said: a planned year holding $0 does not make a total mixed. An ALL YEARS view of $140M executed, beside FY27–FY30
      that hold no plan, carries no NOTE and no box. Neither does FY26 + FY27 ($100M executed, FY27 $0).
    - A dollar counts as money at $0.005 or more either way, so execution that nets below zero still counts as executed money.
  - **No "PLANNED, not executed" beside executed money.** The planned-year note's headline says "FYxx is PLANNED, not executed"
    only when the total holds no executed money. When the total holds executed money, the headline gives both amounts, then
    names the planned years. Variant B, FY25 + FY26: "This total holds $100.00M executed and $300.00M planned. FY25 is a planned
    year." FY25 alone ($300M, all planned) still says "FY25 is PLANNED, not executed."
    - The sentence "This scope mixes the two: $X executed, $Y planned" is removed. It was decided by year kind, so it also
      appeared over $140.00M executed and $0.00M planned.
    - Nothing else on the panel calls the whole total planned while it holds executed money. The scope label's "PLANNED (board
      allocation, …)" appears only when no year in scope has execution counted in it. Its total then holds no executed money.
      It is unchanged.
  - **Rows stored under a year are told apart from the year they count in.** Say a planned year has rows stored under it, all
    counted in a later year by the OBBBA rule. The panel now says so.
    - The FY25 year button read "FY2025 has no O&M execution imported". It now reads: "FY2025: the O&M rows imported for it are
      stored under FY2025 and counted in FY2026 (OBBBA), so FY2025 O&M is read from its plan — this board’s own allocation".
    - The planned-year note read "Nothing in scope has executed in that year yet". It now reads: "The rows stored under FY25 are
      counted in FY26 (OBBBA), so the chart reads O&M’s own allocation for it". It asks this board's own appropriation only, as
      the button does: another appropriation's carried rows are not why O&M's year is read from its plan. (The first draft asked
      every appropriation in scope; the adversarial review showed it could then give Spares' carried row as O&M's reason. Fixed
      before integration, with a case and the mutation `v200-r1-stored-note-any-appn`.)
    - `flowStoredIn(fy, aps)` reads the workbook's own years (`flowExecYears(a, true)`).
    - A year with no rows stored under it keeps its old wording.
  - **Test:** `audit-recon.mjs`, scenario "v2.00 (R1) — mixed totals are said with their amounts, and stored rows apart from
    their effective year", 19 checks (17 drafted, 2 added at integration for the note's scope). Every expected value is the fixture's own arithmetic. On `e635775`, 8 of them fail. The
    other 9 pass there: 7 CONTROLs, plus the kept ALL YEARS NOTE and box.
  - **One R1 check changed with the decision:** "variant B · FY25 + FY26 · the panel" expected FY25 to be called "PLANNED, not
    executed". It now expects no year called that beside executed money, and its description says so.
  - **Mutations:** 11 new (`v200-r1-stored-note-any-appn` added at integration): `v200-r1-mixed-by-kind`, `-export-mix-by-kind`, `-panel-mix-by-kind`, `-allyears-note-dropped`,
    `-allyears-box-dropped`, `-planned-beside-executed`, `-amounts-total-as-executed`, `-stored-tooltip-unsaid`,
    `-stored-note-unsaid` and `-stored-by-effective-year`. Each applies exactly once, and the new scenario catches each one.
    - `v200-r1-mixed-disclosure-b` is re-anchored on the new `flowIsMixed` line, with the same replacement. It is still caught.
    - Every other mutation still applies exactly once.
  - **Interpretations, stated for Brad to confirm (adversarial review, 11 Oct):**
    - "Whenever the selected total includes both" was read as "exactly when". A total whose planned side holds $0 no
      longer carries the NOTE or the box, which matches R1's Variant A ($140M, all executed, no such NOTE).
    - "Whole-total PLANNED box" was read broadly. Read strictly, no surface ever called every year in scope PLANNED
      beside executed money, and nothing would change. The broad reading is that no "PLANNED, not executed" headline
      appears at all while the total holds executed money. One R1 expectation changed with it (above). If Brad meant the
      strict case, that headline change and the expectation change are reverted.
  - **Not covered (tracked):**
    - Execution that nets to $0 (+$100M and −$100M OBBBA rows) is $0 of executed money. So the box and NOTE are not
      shown, and the note says "PLANNED, not executed", while the scope label still says "FY25 planned, the rest
      executed". No test exercises a negative or cancelling total.
    - The FY26 button does not say that its execution is rows stored under FY25 (ledger U8).

- **R2 — an EEIC is checked in the form it is stored** (the same review; fix approved by Brad on 11 Oct). The RCN / EEIC list keeps an
  EEIC trimmed and upper-cased, but item 91's limit (v1.99: a code over its limit is refused, never cut) measured it
  as typed. Upper-casing can make text longer: ß becomes SS, and the ligature ﬃ becomes FFI. Ten ß passed the
  10-character check and were stored as 20 S. That is a code over its limit, written by the board itself. Four ﬃ
  were stored as 12 characters in the same way.
  - **The fix:** `rcnSet` checks the EEIC trimmed and upper-cased, the same expression it stores. An EEIC that is
    too long in that form is refused like any other over-limit code. The list keeps what it had, the field keeps
    what was typed and is marked, and the status says the EEIC was not changed. The RCN is stored trimmed only,
    which is the form it was already checked in, so the RCN is unchanged. No other typed code had this gap: every
    other `codeTake` caller stores the value it checked.
  - **Test:** `audit-board.mjs`, "v2.00 (R2) — an EEIC is checked in the form it is stored". Each case types into a
    field of its own while the list holds AAAAA, and every expected value is a literal.
    - ß×10 and ﬃ×4 are refused. These two checks fail on `1c94537`.
    - The CONTROLs pass before and after: ABCDEFGHIJK (11 as typed) is refused; " ab12c " is kept as AB12C;
      ABCDEFGHIJ is kept; ß×5 (exactly 10 once upper-cased) is kept as SSSSSSSSSS.
  - **Probe:** The outside review's `code-runtime-probe.mjs` passed 4 of 6 checks before the fix and passes 6 of 6
    after it.
  - **Mutations:** `v200-r2-eeic-checked-raw` (the check reads the text as typed) and `v200-r2-eeic-not-upper` (the
    check trims but does not upper-case). `audit-board` catches each on both refusal checks. For typed text the
    two behave the same; they are different edits. `v199-rcn-cut` still matches once and is still caught, so it
    needs no re-anchor here.
  - **Limits:**
    - **The refusal says why (Brad, 11 Oct).** It says the limit is on the EEIC as it is kept, trimmed and
      upper-cased, and names what was typed when upper-casing changed it: "The EEIC is measured as it is kept,
      trimmed and upper-cased: “ßßßßßßßßßß” becomes “SSSSSSSSSSSSSSSSSSSS”, 20 characters; it can be at most 10."
      The field's own explanation reads the same. The RCN, kept as typed, keeps item 91's wording. Checked in
      `audit-board.mjs`, "v2.00 (R2) — an EEIC refusal says the limit is on the EEIC trimmed and upper-cased";
      mutation `v200-r2-why-unexplained`.
    - Length is counted as before, in UTF-16 code units (`String.length`), the same count `codeIssues` uses.
    - An EEIC that arrives in a file is stored as it arrives, without upper-casing. `codeIssues` therefore already
      measures the stored form, and it is still kept whole and listed, as in item 91.

- **R3 — a locked view is never written to the working folder** (the same review; fix approved by Brad on 11 Oct).
  - **What was wrong.** A folder save (💾 Save, the autosave, ⬆ Publish now) checked for a locked cycle on screen
    only before its first wait. Suppose a cycle was put on screen (👁 View) while the save was reading the folder's
    copy. The save then built its bytes from that locked plan and wrote them over the working plan's copy, keeping
    that copy in the history. The board said "✅ Saved", after a "🔒 Not kept" prefix, and the save reported success
    to its caller.
  - **The fix.** `_driveStorePushRun` checks `cycBlock` again once the copy is read, before the year check and before
    it builds anything. With a locked cycle on screen:
    - nothing is written: no copy, no history copy, no lock;
    - the folder stays byte-identical;
    - the save returns false, so the autosave and ⬆ Publish now do not count it as saved;
    - the board says writing to the shared folder is off while that cycle is on screen.
  - **The test.** `audit-import.mjs`, "v2.00 (R3) — a locked view is never written to the working folder". Each case
    holds a folder save at its read of the folder's copy, puts PB27 on screen, then lets the save go on.
    - (a) Save. Nothing reaches the folder, the save does not report success, and the board does not say saved.
      After leaving the view, the working plan is still unsaved, and the next Save writes it (a control).
    - (b) ⬆ Publish now. Nothing is written, and no publish is recorded.
    - (c) A control: the same held save with nothing put on screen writes the working plan and says saved.
    - On `9b27e80` four checks fail; with the fix all eight pass. The races probe's R3 case fails on `9b27e80` and
      passes with the fix, and its control passes on both.
  - **Mutations.** Each is caught by the block, on the checks named:
    - `v200-r3-cycblock-gone` removes the check: the no-write, return and status checks fail.
    - `v200-r3-cycblock-falls-through` says the refusal but goes on writing: the same checks fail.
    - `v200-r3-cycblock-says-saved` refuses but returns true: the return check and ⬆ Publish now's "no publish
      recorded" check fail.
    - Each new find matches the board once, and every existing mutation still matches exactly once.
  - **Tracked, not changed: the later window (bounded probe, 11 Oct).** Sometimes a cycle is put on screen **after**
    the save has built its bytes, while its history copy, main copy or lock is being written. That case is not
    checked again. A bounded probe at `8f22668` held the save at each of those writes, on an edited board and on a
    clean one. In every case:
    - the folder got the working plan whose bytes were built, never the locked plan, and history kept the copy it
      replaced;
    - after leaving the view, **the screen reads unsaved again** (`DIRTY`), though the folder and this browser's record
      (`_baseDirty`, the stored record) both hold the working plan as saved. `cycView` keeps the unsaved flag as it
      was when the view opened, and `cycLeave` puts it back; the save that landed meanwhile cleared only the view's.
      This happens when the board was unsaved as the save began. Only the screen flag is stale; the next Save writes
      the same plan again. A first run of the probe missed it: it connected the folder before the board's opening
      timers had run, and they cleared the flag during the hold. Tracked; a fix is proposed to Brad separately;
    - a later edit read unsaved, and the next Save wrote it.

    The status line was wrong: it said "🔒 Not kept — PB27 is a locked view. ✅ Saved O&M FY27 to the shared folder".
    That contradicts itself, and does not say the working plan is what was saved. The prefix came from `persist()`,
    which refuses in the view. The evidence is in `recovery/v200/evidence/L2-r1-r5/R3-late-window-8f22668/`.
  - **The message, as Brad approved on 11 Oct.** A folder save that lands while a locked view is on screen now says
    "✅ Saved the working plan of O&M FY27 to the shared folder — N KB, built before PB27 was put on screen. PB27
    is a locked view: nothing in it is saved. Everyone sees the working plan on their next refresh." It never says
    "Not kept".
    - It is said for the quiet autosave too. That save used to say nothing on success, which left `persist()`'s
      "not kept" refusal on screen.
    - This is a message change only. What is written, the history, and the unsaved flags are unchanged.
    - **Test:** `audit-import.mjs`, "v2.00 (R3) — a save that lands under a locked view says it saved the working
      plan":
      - Save, with PB27 put on screen during the copy's write: the folder content, the history and the flags as
        controls, plus the message;
      - the quiet autosave in the same window;
      - a held save with nothing put on screen, which still says "✅ Saved O&M FY27" (a control).
    - **Mutations:** `v200-r3-landed-view-unsaid` (the old message) and `v200-r3-landed-view-prefix` ("Not kept"
      left in front).

- **R4 — a Save already waiting does not write past a mixed-import hold** (the same review; fix approved by Brad on 11 Oct). `_saveInPlaceFileRun` checked the hold
  once, before it waited for permission and for the board file's read. If a full import stopped part-way during that
  wait and could not be put back, it set the hold. The Save then built its bytes from the mix and wrote them over the
  board file. The outside probe showed `writes 1`, and the file held the imported Full Fund note `PARTIAL FF`. The
  Save now checks the hold again straight after the read, before it asks anything or builds its bytes. Nothing is
  opened or written, the board file keeps its bytes, and the message line says saving to the board file is refused
  and why. Checked in `audit-import.mjs` by "v2.00 (R4) — a save already waiting does not write past a mixed-import
  hold". It fails on 1c94537: the file is opened and written, and the board says it saved. A control with no import
  writes once. Mutations: `v200-r4-no-recheck`, `v200-r4-held-quietly` and `v200-r4-said-not-held`.
- **R4b: a Save asked for during the hold is refused before the file is touched (Brad's contract, 11 Oct).** This
  is a test only. The board already refused such a Save at the start of `_saveInPlaceFileRun`. Because of R4's second
  check, removing that first check (`impmixed-file-unguarded`) no longer showed in the v1.95 hold block, which looked
  only at what was written. "v2.00 (R4b) — a Save asked for during the mixed-import hold is refused before the file is
  touched" counts permission requests, reads and opens. It expects `perm 0 · read 0 · open 0`, the request finished,
  and the board saying Save is refused. Then the hold is cleared while a read is held. Nothing is written, and the
  file keeps its bytes. A Save starts a turn after it is asked for, so the test waits until the Save has been decided
  before it clears the hold. It catches `impmixed-file-unguarded` on the before-file-access check
  (`perm 1 · read 1 · open 0`). It passes on 1c94537, because the check it guards was already there.
- **Tracked, not changed (proposed to Brad separately, 11 Oct):**
  - Sometimes a Save is asked for while the hold is on and another save is still running. That Save is queued
    ("⏳ A save is already under way"), not refused at once. When its turn comes it is refused before any file
    access, but only if the hold still stands. If the person allows saving again first, the queued Save runs and
    writes. A scratch run showed this. Brad's wording ("refuse immediately") may want `saveInPlaceFile` to refuse it
    at once, as it does for a locked view. The adversarial review found that the 💾 Save button and Take the pen go
    through `saveInPlace()`, which queues the same way, so a refusal at once would be needed there as well.
  - Not examined: the folder save (`_driveStorePushRun`) also checks the hold only before its folder read.
  - Both are built since, as U3 and U4 (below). After U3, removing the check at the start of the board file's save
    (`impmixed-file-unguarded`) is caught by the U3 block's "asked for before the hold" case, no longer by R4b's
    before-file-access check, which a Save asked for under the hold no longer reaches (U3's entry says why).

- **R5 — a restore during a save stays unsaved** (the same review; fix approved by Brad on 11 Oct).
  - **What was wrong.** ↶ Put this back (`driveRestore`) set the board unsaved (`DIRTY`), but it did not count as a
    change (`_saveGen`) and did not mark this browser's record unsaved (`_baseDirty`, `baseGet().dirty`). Suppose a
    folder save was still writing when an earlier copy was put back. When that save finished, it found the count
    unchanged and marked the board saved: `DIRTY`, `_baseDirty` and the stored record were all false, and the board
    said "✅ Saved". Yet the earlier copy was on screen and the folder held what the save had written. Nothing showed
    that a Save was still needed. After a reopen, the stored record decides whether a newer folder copy keeps the work
    aside first (`ownUnsaved`). It said saved, so the copy put back could be replaced unasked. That last step comes
    from reading the code; it was not run.
  - **The fix.** `driveRestore` now does what `save()` does for an edit, at the point where it adopts the copy:
    `_saveGen++`, then marks the record unsaved if it was not. The save that was writing now leaves the board unsaved,
    and its status adds "A change made while it was saving is not in the folder yet". The folder keeps what that save
    wrote, and the next Save writes the copy put back, with no clash. That is two lines and a comment, in one place.
  - **The test.** `audit-import.mjs`, "v2.00 (R5) — a restore during a save stays unsaved". Each case holds a folder
    save at the close of its write of the copy, then lets it land.
    - (a) WORKING is saved, and HISTORY is put back while it writes. HISTORY is on screen, the folder holds WORKING, and
      `DIRTY`, `_baseDirty` and the stored record all say unsaved. The board says the change is not in the folder yet.
      Then Save (a control): it writes HISTORY with no clash, ends saved, and WORKING is kept in the folder's history.
    - (b) The same with nothing new saved (⬆ Publish now, or Save again). The board was clean, so this browser's record
      said saved before the restore. Afterwards, all three say unsaved.
    - (c) A control: the same held save with nothing put back ends saved and says "✅ Saved".
    - On `9b27e80` four checks fail: the unsaved state and the "not in the folder yet" status, in (a) and (b). With the
      fix, all seven pass, in four runs. The races probe's R5 case fails on `9b27e80` and passes with the fix. Its
      control passes on both.
  - **Mutations.** Each is caught by the block:
    - `v200-r5-restore-gen` drops the `_saveGen++`. The (a) and (b) unsaved checks and the status checks fail.
    - `v200-r5-restore-basedirty` drops the record line. The (b) check fails: `_baseDirty` and the record are false.
    - `unsaved-flag-never-set` is re-anchored on its indent (`"\n  try{ if(!_baseDirty)…"`), because the R5 line
      repeats the line it targets. It still removes only `save()`'s line, and existing blocks still catch it, for
      example "v1.95 — Save acknowledges exactly what it wrote (the shared folder)".
    - Both new finds match the board once. Every other existing mutation still matches exactly once.
  - **What users may see.** A plain ↶ Put this back, with no save running, now also marks this browser's record unsaved.
    So a reopen keeps the copy put back aside and loads the folder's newer copy with a message, where before it replaced
    it without a word. That protects the work better. It also fills the kept-aside slot, so a later keep-aside can answer
    that the slot is taken.
  - **DATA LOSS, for Brad's decision (proposed separately, 11 Oct; outside R5's approved scope).** ↶ Put back of work kept aside (`keptPutBack`) has the same gap. It sets `DIRTY` and the
    record but does not count a change. In a scratch run on the patched board, kept work put back while a folder save
    was writing was then marked saved: `DIRTY`, `_baseDirty` and the record were false, and the folder held HISTORY,
    not the work put back. The adversarial review then reopened that board: the work put back was **in no copy at all**
    -- not on screen, not kept aside, not in the folder, not in its history. R5 covers ↶ Put this back only, so this
    is left for Brad's decision. It is not covered by a check.

- **U2 — work put back during a save stays unsaved** (Brad, 11 Oct: "Proceed with U2's counter repair and busy-save refusal as
  separate commits"). This is the counter repair. ↶ Put back of the work kept aside now counts as a change (`_saveGen`),
  as an edit does. A folder or file save still writing when the work was put back used to find the count unmoved and mark
  the board saved, while the folder or file held what that save wrote. The next Live refresh then replaced the work put
  back, and a reopen lost it. Now that save leaves the work unsaved and says so, a refresh and a reopen keep it, and the
  next Save writes it.
  - Not closed by this change alone: the landing save still records its own copy as the checkpoint. So the next Save, or
    the autosave, writes the work put back over that copy without asking. The copy written over stays in the kept slot,
    and in the folder's history for a folder. The busy-save refusal, a separate commit, closes this.
  - Test: audit-import "v2.00 (U2) — work put back during a save stays unsaved": folder and file races, a live
    refresh, reopens, and a direct count check. Mutation `v200-u2-putback-gen`.
- **U2 — ↶ Put back waits for a save to finish** (Brad, 11 Oct: "Proceed with U2's counter repair and busy-save refusal as
  separate commits"). This is the busy-save refusal. While a save is under way, ↶ Put back of the work kept aside now
  changes nothing: what is on screen and the work kept aside stay exactly as they were, nothing is asked, and the board
  says "Not put back: a save was under way. Nothing was changed … Put it back once the save has finished". The line is
  in the past tense because a quiet autosave says nothing when it lands, so the line can still be on screen afterwards.
  Once the save has finished (saved, failed, refused, canceled or thrown), putting the work back works as before: the
  folder's refresh then leaves the folder's copy alone, and a reopen keeps both copies. This closes what the counter
  alone left open. That the next 💾 Save asks before writing over the copy was measured in the draft probe (`u2variants`,
  B5), not in this block.
  - **What users may see:** a put-back pressed during a save is refused and must be pressed again once the save has
    finished. The top bar's ↶ work kept aside stays offered throughout.
  - **Test:** audit-import "v2.00 (U2) — put back waits for a save to finish". It covers folder saves that go in, fail,
    are refused, or throw (an autosave); board-file saves that go in, fail, or are canceled; and an autosave that lands
    after the refusal. Each scenario then checks the retry and a reopen, and for the folder the refresh as well.
    Mutation `v200-u2-putback-while-saving`.
  - **Not covered:** a save waiting for another tab's Web Lock was not counted as under way until it started; U20
    (below) counts it from the moment it is asked for.
- **U13 — a refresh during a save loads nothing** (Brad, 12 Oct, 6:00 AM ET: "implement U13's refusal to adopt another copy
  while saving, as a separate commit. Re-check immediately before adoption after any waits."). The folder's refresh (the Live
  timer, the bar's Connect, the opening's own connect) used to load a newer folder copy while a save was still writing. The
  save, landing, found nothing changed and marked the board saved against the copy it wrote, while the screen showed the copy
  loaded; the next refresh and a reopen said nothing. No second writer was needed: a copy already in the folder, stamped ahead
  of this machine's clock, was enough. Now the refresh checks for a save under way after its last wait, just before it would
  change anything, and while one is under way it loads nothing and changes nothing: what is on screen, browser storage, this
  browser's record, the change count and the work kept aside stay exactly as they were. With nothing recorded for the folder,
  it also no longer records the folder's copy as the one the work came from during a save (a save still to read the folder
  would then have written over that copy without asking).
  - **What users may see:** a Connect during a save (or during Load theirs, which waits in the same queue) says "⏳ The shared
    folder’s copy of O&M FY27 was not loaded: a save or Load theirs was under way, so this board kept its own copy of O&M FY27.
    The folder’s copy is checked again on the next refresh once that has finished …", until the save says how it ended. The
    words name the board's copy only, because the same Connect still loads the execution data, the reprogramming log and cost
    estimates. The Live timer says nothing and tries again at its next tick. The unsaved-changes warning is unchanged.
  - **Test:** audit-import "v2.00 (U13) — a refresh during a save loads nothing" (71 checks): the copy stamped an hour ahead,
    reopened two ways, with every refresh during a held save; a second writer saving during the save; refreshes held at their
    read or their first wait while a save starts; nothing recorded for the folder (no clash said); the next refresh after a
    save that went in, failed, was refused or was canceled; a Connect during a save that loads the folder's execution data and
    reprogramming log; a Connect during Load theirs; and three controls. 42 checks fail on the board before the change; every
    control passes on both.
  - **Mutations:** `v200-u13-pull-while-saving`, `v200-u13-base-while-saving`, `v200-u13-pull-unchecked`,
    `v200-u13-said-nothing-loaded`, `v200-u13-clash-while-saving`; each caught by the focused block (full-suite sensitivity
    runs in the final-tree queue). Since U30 (below), this block's case (3c) stops at U30's rule before U13's
    base-record guard, so `v200-u13-base-while-saving` and `v200-u13-clash-while-saving` are caught by the U20 and U30
    blocks' cases that put the folder's copy itself on screen (U20 (4), U30 (5b)).
  - **Not covered:** a copy another writer saves during the save was still written over and kept nowhere in the folder (U18, built below: now
  only one that lands during the write itself);
    a save waiting for another tab's Web Lock was not counted (U20, below, counts it); the other adoption paths in the
    ledger (U24).
- **U1 — a carried row is counted in an offered year and in ALL YEARS** (Brad, 12 Oct, 6:11 AM ET: "Proceed with U1 as its own
  commit, followed by U14 separately. Preserve the independent arithmetic and saved-selection controls."). A row the carryover
  rule counts in a year that is neither a workbook year nor in the plan window was counted in no year: FY25 OBBBA rows counted
  as FY26, when FY26 was neither imported nor planned, were left out of ALL YEARS, the panel and the export with nothing said,
  and a saved FY26 selection silently showed every year. On the synthetic fixture ALL YEARS was $540,000,000 of $660,000,000,
  short exactly the $120,000,000 carried. The year buttons now offer every year a row is counted in, beside the workbook's
  years and the window. A selection saved for FY25 alone stays FY25 alone after reopening. Predates R1.
  - **What users may see:** a year button for a year a carried row is counted in (FY26 in the example), and ALL YEARS higher
    by the carried amount.
  - **Test:** audit-recon "v2.00 (U1) — a carried row is counted in an offered year and in ALL YEARS" (78 checks): the
    independent arithmetic (FY26 × {O&M, Initial Spares} = $400M, O&M $300M, Initial Spares $100M, each read apart from the
    calculation, the panel and the export); the plan removed by Reset to blank and as a year the board does not hold
    (100 / 0 / 100, no cloned budget, nothing asked), with a detector control (a roll-forward copy made on purpose is seen by
    the same checks); and the saved FY25-only controls, reopened, with the plan held, after each removal, and where every
    FY25 row is carried. 47 checks fail on the board before the change; every control passes on both.
  - **Mutations:** `v200-u1-year-unoffered`, `v200-u1-own-appn-only`; the R1 mutation `v200-r1-saved-year-widens` also fails
    the carried-FY25 control.
  - **Not closed by this change alone:** a saved FY26 that rests only on a counted row becomes all years when the carryover
    rule is switched off, and a plan held outside the window is in no year. U14, next, closes both.
- **U14 — ALL YEARS holds every plan the board holds; a saved year selection is kept and said** (Brad, 12 Oct, 6:00 AM ET:
  "For U14, I choose ALL YEARS to include genuine stored plans and execution by effective year within the selected
  appropriations. Never create or copy a budget merely because a year becomes available. Explicit saved selections must
  never silently switch to ALL YEARS; retain an unavailable selection with a clear notice."). A plan the board held for a year
  outside its plan window was in no year and no total: on an FY27 window, the board's own FY26 plan of $300,000,000 was left
  out of ALL YEARS ($640,000,000 of $940,000,000 on the synthetic fixture), while the board's own 🗓 menu listed FY26; and a
  saved FY26 selection silently became ALL YEARS once FY26 stopped being offered. The year buttons now also offer every year
  the board holds a plan for. Nothing is made: the board's years are read as stored, and reading, saving, reopening and
  moving the base year change none of them; a year Reset to blank is still offered and reads $0. A saved year the board
  cannot answer for now (no plan held, no row filed or counted in it, outside the window) stays in the saved selection, is
  not counted, and is named with what is counted instead: in the scope (the panel, the chart and its image, the export's
  Scope line), in a notice on the panel, and in the export's first NOTE. While it is kept, switching a year on or off keeps
  it and the years counted beside it stay lit; ALL YEARS, or a year's "only", chooses again, as the notice says. The ALL
  YEARS label names its years as they run ("FY25, FY27–FY31 · all years"), never with a dash across a year in no total.
  Asking whether a requirement is marked UPL no longer writes an empty mark list into the year being read.
  - **What users may see:** ALL YEARS rises where the board holds a plan outside its window, and that year gets a "· plan"
    button; a saved selection whose year is no longer available shows the notice where it used to show every year, and $0
    if that was its only year.
  - **Test:** audit-recon "v2.00 (U14) — ALL YEARS holds every plan the board holds; a saved year selection is kept and
    said" (63 checks): seven ALL YEARS cells (the carryover rule off and on, with and without the plan and a carried row, and
    a control window from FY26); the saved selections through a base-year move, the rule switched off, Reset to blank, save
    and reopen; a year switched on and off, a year's "only" and ALL YEARS beside a saved year not available, and the year
    buttons lit beside it; and two such years, said in the plural. 44 checks fail on the board before U1 and 40 on the U1
    board.
  - **Mutations:** `v200-u14-stored-unoffered`, `-saved-falls-back`, `-export-notice-dropped`, `-label-dash-gap`,
    `-read-makes-year`, `-toggle-drops-saved`, `-toggle-collapses`, `-panel-notice-dropped`, `-read-writes-marks`,
    `-chips-unlit-beside-unavailable`, `-toggle-off-drops-saved`, `-only-keeps-saved`, `-allyears-keeps-saved` and
    `-notice-plural-it`; each caught by the focused block (full-suite sensitivity runs in the final-tree queue).
  - **Not covered:** partner and FMS type-ins for a year not offered (not counted and not said; this predates U14); a
    locked-cycle view; whether a long label fits the 1,280-pixel chart image; and Brad's open questions on this commit (the
    `rlgIsUpl` line's place, those type-ins, and what "genuine stored plans" takes in).
- **U20 — a save waiting for another tab's save is under way** (the lead's decision under Brad's word of 12 Oct, about
  5:30 PM ET: "Don't wait for me. Let's keep pressing throughout to get this next version published."). A save waits for
  the 'orbit-save' Web Lock, so that one save runs at a time across this browser's tabs. It was counted as under way only
  once it held the lock. While it waited for another tab's save, ↶ Put back (U2) and the folder's refresh (U13) took it for
  no save at all: Put back went ahead under it, a refresh loaded a newer copy under it, and a refresh with nothing recorded
  for the folder took the folder's copy as the one the work came from. The waiting save then wrote over that copy without
  asking. With a history copy kept less than ten minutes before, the copy written over was kept only as a recent copy, and
  one more Save removed it: it was in no copy the board could reach. Now a save is counted from the moment it is asked for,
  waiting included, until it has finished, however it ends: saved, refused, failed, thrown, or its lock request refused.
  Load theirs, which waits in the same queue, is counted the same way.
  - **What users may see:** while a Save or Load theirs waits for another tab's save, ↶ Put back is refused in U2's words
    ("⏳ Not put back: a save was under way …"). A Connect that finds a newer copy in the folder says it was not loaded, in
    U13's words; one that finds a copy no newer than the screen says nothing and records nothing, as during a save. A second
    Save asked meanwhile says "⏳ A save is already under way — this one runs as soon as it finishes." Once the save has
    finished, both work as before.
  - **Test:** audit-import "v2.00 (U20) — the Web Locks stand-in behaves as the API does" (19 checks). This is the U20
    probe's lock mock, ported as the suite helper `webLocks()`, with its own tests: first come first served across tabs, a
    rejection and a throw letting go, let go before request() settles, independent names, ifAvailable, shared and
    exclusive, query and a closing tab, what it does not model refused, and 300 seeded requests. Then audit-import
    "v2.00 (U20) — a save waiting for another tab’s save is under way" (65 checks): two tabs of one browser share one lock
    manager, and the second tab's 💾 Save waits for the first tab's held save. It covers ↶ Put back, a refresh of a newer
    copy, and Live view's ↻ Refresh now with nothing recorded, with and without a history copy kept minutes before; after
    the refresh it checks Save yours over theirs and one more Save. It also covers the screen exactly the folder's copy,
    and Load theirs as the operation that waits. Controls: a second Save waiting behind this tab's own save; the waiting
    save counted by the harness itself (the uncounted wait alone was the cause). Checks labelled a GUARD pass on the board
    before the change too, by design: the stand-in's sanity at the end of each case, how a save ends when the autosave
    throws, when the lock request is refused and when asking for it throws, and Save yours over theirs without a history
    copy; each holds what a wrong form of the change would break. 23 checks fail on the board before the change, and every
    one of them is neither a control nor a guard; every control and guard passes on both.
  - **Mutations:** `v200-u20-wait-uncounted`, `v200-u20-failed-stays-counted`; each caught by the focused block (full-suite
    sensitivity runs in the final-tree queue).
  - **Not covered:** the first waiting Save gives no sign that it waits (the U20 probe's O1). Not run as the operation that
    waits: ✍ Take the pen and Save yours over theirs. Save yours over theirs asks its question inside the queue, so a tab
    with that dialog open holds the lock: saves, ↶ Put back and adoption in this browser's other ORBIT tabs wait or are
    refused meanwhile, in words that do not say the save is in another tab (no copy is lost). When what waits is Load
    theirs, U2's refusal still says "a save was under way". Real Chromium: the round-1 money review ran this change in real
    Chromium with Chromium's own Web Locks (board `c42be8e7`, whose `saveSerial` is this commit's): two and three tabs, a
    waiting save counted, ↶ Put back refused while it waits, a second Save counted as two, a waiting save that throws, a tab
    closed while it holds the lock, and the board opened from file://; all of that passed. It was run again on the final
    board of the fix round (`84cf2bf4`), with the same result: every behavioural check passed, and on the board before the
    change the six checks of a waiting save fail. (The script's own check that the page makes no other request fails on both
    boards, because the board asks for its shared state file; that is the script's assumption, not the board.) A refresh that
    records the folder's copy as the base with no second tab is U30, next.
- **U30 — a refresh takes the folder's copy as the one the work came from only when it is what is on screen** (the lead's
  decision, as for U20). It applies with nothing recorded for the folder: an opening that found no copy there and a
  colleague's or another machine's save after it, a reopen with unsaved work, a board saved to its own file, a board file
  handed over, another year never loaded here, or a browser that never kept a record. A refresh that found the folder's
  copy not newer than the screen took it as the one the work on screen came from, "as it always was" (v1.89), whatever was
  on screen. The next 💾 Save then wrote the work on screen over that copy without asking. So did the Live timer's
  autosave, one tick after it had said "Nothing was written" and offered the choice. With a history copy kept less than
  ten minutes before, the copy written over was kept only as a recent copy, and one more Save removed it. No second tab
  was needed; U20 was its two-tab form. Now the refresh records the folder's copy only when it is what is on screen: the
  same stamp, as every change stamps the board anew. Otherwise it records nothing and says nothing, and Save asks: Load
  theirs (your work kept aside), or Save yours over theirs (theirs kept in the folder's history as a spaced copy, whatever
  the spacing). With nothing recorded, nothing the board says on that route claims an order it cannot know: Save's
  question no longer says theirs was saved "after the copy you are working from"; ↶ Put back, after Load theirs, no longer
  says Alice saved the folder's copy "after it"; and Load theirs refused for work already kept no longer calls the
  folder's copy "a newer copy".
  - **What users may see:** with nothing recorded and other work on screen, 💾 Save and every autosave tick say
    "⛔ Alice saved O&M FY27 to the shared folder 2 minutes ago, and this browser has no record of which copy in the folder,
    if any, the work on screen came from. Nothing was written. Load theirs … · Save yours over theirs …" until one is
    chosen. After Load theirs, ↶ Put back says "… 💾 Save will ask before it writes over the shared folder, which Alice
    saved; this browser has no record of which copy there, if any, this work came from." With other work already kept,
    Load theirs says "⚠ Alice saved a copy to the shared folder (…), but this browser already keeps earlier work aside …
    so their copy was not loaded and nothing was lost." Until now the board wrote over the folder's copy without asking.
    A board showing exactly the folder's copy is recorded as before and saves with no question. With a copy recorded, all
    three lines are unchanged, and so are the words for work kept aside from a board file.
  - **Test:** audit-import "v2.00 (U30) — a refresh takes the folder’s copy as the base only when it is on screen" (89
    checks). The rule is the stamp, so it is run through every way a refresh comes with nothing recorded:
    - the Live timer alone in one tab, with and without a history copy kept minutes before: tick 1, tick 2 and 💾 Save
      each ask and write nothing, and the words are checked; then Save yours over theirs, one more Save and a reopen, with
      the folder's copy kept as a spaced history copy throughout;
    - ↻ Refresh now, then Save; and Save, then a refresh, then Save;
    - a second tab whose Save waits while the Live timer ticks twice (U20's case, with the first tick's own refresh after
      the wait);
    - a reopen with unsaved work, whose opening's own connect is not quiet, with and without the history copy; and a board
      saved to its own file, then ↻ Refresh now (the tests review's cases; both then Save yours over theirs, one more Save
      and a reopen);
    - a board file handed over, newer than the folder's copy: Save, Load theirs and ↶ Put back, with the put-back line
      checked word for word; and the same with other work already kept, with the refusal checked word for word;
    - another year: FY28 saved by another machine and never loaded here, ↻ Refresh now on FY28, then Save;
    - controls: the screen exactly the folder's copy, recorded and saved with no question (and during a save, U13's rule
      holds); the first save of a new board into an empty folder; an ordinary refresh with nothing unsaved; and, with a
      copy recorded, the question's words, the put-back line and the kept-work refusal as they always were; and work kept
      aside from a board file, put back with its old words.
    Checks labelled a GUARD pass on the board before the change too, by design (the first Save's question, the stand-in,
    and Save yours over theirs with no history copy). 46 checks fail on the board before U20, and 44 on the U20 board; each
    is neither a control nor a guard. Every control and guard passes on all three.
  - **Mutations:** `v200-u30-base-whatever-on-screen`, `v200-u30-base-only-other-copy`, `v200-u30-unrecorded-said-after`,
    `v200-u30-recorded-said-unknown`, `v200-u30-unsaved-this-session-only`, `v200-u30-quiet-refresh-only`,
    `v200-u30-unsaved-only`, `v200-u30-putback-said-after`, `v200-u30-putback-said-unknown`, `v200-u30-putback-file-unknown`,
    `v200-u30-occupied-said-newer`, `v200-u30-occupied-said-unknown`; each caught by the focused block. U13's case (3c) has
    other work on screen, which this rule now stops before U13's guard is reached; on this board U13's
    `v200-u13-base-while-saving` and `v200-u13-clash-while-saving` are caught by the U20 and U30 blocks' same-copy cases.
  - **Not covered:** a different folder copy stamped to the same millisecond as the screen (clock skew) is recorded, as
    before. A folder copy with no stamp at all is written over with no question, as before (every copy this board writes
    is stamped). The ⛔ line repeats at every autosave tick until Load theirs or Save yours over theirs is chosen. A
    non-quiet Connect in this case says nothing about the folder's copy, as before. With a copy recorded and the folder's
    copy not later than it (a copy put on screen from elsewhere: U29, in the ADOPT track), the words "after the copy you
    are working from", "saved after it" and "a newer copy" are still said, unchanged. This commit was not run in real
    Chromium: what it changes (the refresh's rule and three status lines) does not depend on the browser's locks, and was
    run in jsdom with the folder stand-in.
- **U34 — a saved year selection this board did not write is read as no year, kept and said** (Codex's review, as Brad
  supplied it on 12 Oct, about 6:05 PM ET: "the malformed saved-year selection"; Brad: "record the malformed saved-year
  selection ... explicitly"). The board writes a saved year selection in two forms only: nothing (ALL YEARS), or a list of
  whole years from its own buttons. A selection it did not write, as a hand-edited or damaged saved file carries it, was read
  with nothing said. A string ("2026"), an object, a bare number, "", 0, false or an empty list read as ALL YEARS:
  $540,000,000 on the synthetic fixture, with ALL YEARS lit. [2026.5] and 5,000 entries of "x" read the same way. ["2027"]
  counted as FY27 ($500,000,000). [null] and [true] were said as a saved "FY0" and "FY1". [2025, 2026.5] counted FY25 and
  said nothing of the rest. The money always matched across the calculation, the panel and the export, and the file kept the
  value through a save. Now only no saved selection (null, or no key) is ALL YEARS -- and a whole saved value too large
  for the browser (1e999), which the opening reads as null (see Not covered). A year is a whole number, as the board
  writes it.
  Anything else is read as no year: it is not counted, it is kept as saved, and it is said, with what is counted instead.
  International Partner and FMS money typed in for a year is counted only for the years read. It is said in the
  scope (the panel, the chart, the export's Scope line), in a notice on the panel and in the export's NOTE, under U14's when
  both apply. The notice quotes the file, shown as text: at most three entries, each cut at 40 characters (a quote of 40 is
  shown whole; one of 41 is cut to 40 and "…"), between characters, never inside one. Every U+FFFE and U+FFFF, which XML
  1.0 forbids, is quoted as its escape ("\uffff"), so the exported workbook stays well-formed. A selection holding
  something the board cannot read is never ALL YEARS, even when the years it can read are every year offered: ALL YEARS is
  not lit, those years are, and the label names them. Duplicates are still read once, and an unsorted list in order, with
  nothing said. ALL YEARS, a year's "only", or a year switched on or off chooses again and replaces what cannot be read, as
  the notice says. A toggle starts from the years the board could read.
  - **What users may see:** a saved file whose year selection was edited by hand or damaged now opens on "no year counted",
    or on the years the board could read, with a notice saying what the file holds. It used to show every year (or a year
    the file does not name), with nothing said.
  - **Test:** audit-recon "v2.00 (U34) — a saved year selection this board did not write is never read as ALL YEARS; it is
    kept and said" (39 checks). Each shape is opened from the board's own saved file and read apart in the calculation, the
    panel and the exported workbook (its values read back, and every part of its package parsed as XML), then saved and
    reopened. The 23 shapes are a string, an object, a bare number, an empty list, "", 0, false, a year as text, 2026.5,
    null, true, one whole year beside one that is not, text that is markup (also checked escaped), 5,000 entries, a
    120-character entry, U+FFFF beside 2027, U+FFFE as the whole value, U+FFFF and U+FFFE in one entry beside 2027, quotes
    of exactly 40 and of 41 characters, 45 emoji beside 2027, a year U14 says beside an entry (its two NOTEs checked in
    order), and every offered year beside an entry. Two checks read the whole export: the NOTEs' order, and [2027, "x"]'s
    sheet against [2027]'s, row for row. One check types in FY25 International Partner money ($3,000,000) and FY27 FMS money
    ($2,000,000): beside "2026" none of it is counted ($0 total funding), and beside [2027, "x"] FY27's FMS only
    ($502,000,000), in the calculation and the exported workbook. There are eight controls: no key, null, duplicates, out of
    order, 5,000 of one year, a whole year no appropriation offers, FY1999 on a board holding FY1999 rows, and -2027 (a
    whole number is a year as the board reads it: it need not be in 2000–2099, have four digits, or be above zero). One
    check switches FY27 on beside "2026"; two click controls and a "nothing asked" check follow. 28 checks fail on the
    board before the change (`d66dd60`); the other 11 pass there by design (the eight controls, the two click controls and
    "nothing asked"). U14's 63 checks pass unchanged.
  - **Mutations:** `v200-yearsel-not-a-list-all-years`, `-nothing-read-all-years`, `-number-coerced`, `-fraction-unsaid`,
    `-whole-unsaid`, `-label-unsaid`, `-panel-unsaid`, `-export-unsaid`, `-markup-unescaped`, `-counted-unsaid`,
    `-plural-it`, `-toggle-from-all`, `-quote-xml-unsafe`, `-quote-splits-char`, `-quote-uncut`, `-falsy-all-years`,
    `-falsy-unsaid`, `-allyears-lit-unread`, `-label-all-years-unread`, `-label-ur-unpassed`, `-year-chips-unlit-unread`,
    `-note-replaces-line`, `-note-order`, `-label-unsaid-beside-u14`, `-panel-unsaid-beside-u14`, `-year-range`,
    `-plural-label`, `-quote-escape-first-only`, `-quote-cut-at-40-or-more`, `-quote-cut-above-41`, `-year-four-digits`,
    `-year-positive` and `-other-sources-all-years`. Each is caught by the focused block (full-suite sensitivity runs in
    the final-tree queue).
  - **Not covered:**
    - A whole number that is no plausible year (-2027, 0, 1990, 10000, 99999) is still read as a year and given U14's notice.
      The panel and the scope label print it by its last two digits ("FY-27", "FY0", "FY99"), while the export's NOTE
      prints it whole. The board prints every year this way, and its import accepts any non-zero whole year. The FY1999
      and -2027 controls pin that a year need not be in 2000–2099, have four digits, or be above zero. When those two
      digits are an offered year's, the label says that year twice: [2025, 2125] reads "FY25 · all appropriations · saved
      FY25 not available, not counted" on the panel and in the export's Scope line, and the panel's notice says FY25 has
      no imported row and is not counted while it counts FY25's $40,000,000 (the export's NOTE names FY2125). The money is
      right; the words are U14's (ledger U48).
    - An enormous list of distinct whole numbers is still named in full, and is slow to read. At 3,000 the panel's notice
      is 18,070 characters. At 20,000 it is 118,370 characters, and the calculation and the panel each took 1.3–1.6 s in
      jsdom (the de-duplication grows with the square of the length). The scope label, the export's Scope line and its file
      name name them all. The saved list is also sorted as text, as U14 sorts it, so whole numbers of different lengths
      (999, 10000) are listed out of numeric order.
    - "Kept as saved" means the same value, as the browser's JSON reader and writer keep it, not the same bytes: spaces are
      dropped, [-0] is written back as [0] and [2.027e3] as [2027], and a decimal that is a whole year to a number's
      precision ([2026.9999999999999]) is read as that year (FY27, $500,000,000 on the fixture), with nothing said. A
      number too large for the browser (1e999, -1e999) is already null when the board reads it: opening copies the saved
      state through JSON. As an entry it is quoted as "null" and written back as null. As the whole saved value it is read
      as ALL YEARS ($540,000,000, ALL YEARS lit, nothing said), and the first save writes null, as before the change.
    - A saved selection written as NaN -- what a JSON writer outside the browser can put in a file (Python's json module
      does by default) -- is not JSON, so the file's whole saved state cannot be read. The board opens without it and says
      "Could not read 1 item on opening: the saved board state in this file. That data is NOT loaded — do not save over
      this file until you have checked it, or the unread part will be lost.", and then, in the same opening, replaces that
      line: with "SHELL TEMPLATE v2.00 (11 Oct 2026) — no data inside (safe for any machine)…" in a browser that holds no
      board, or with "No saved state in this copy — make sure you opened the latest board file…" in the browser that holds
      it. A Save from there writes a board without the file's saved state: no requirements in the first
      case, and this browser's own copy without the file's imported execution rows in the second. The same before the
      change; ledger U47.
    - U+FFFE and U+FFFF in the saved selection are quoted as their escape ("\uffff"), not as the character the file holds.
    - A saved selection nested about 4,150 lists deep or more stops the board opening at all (a stack overflow at boot, in
      jsdom; 4,154 opened in one boot and not in the next; the same before the change). Before the change, at every depth
      tried from 3,654 to 4,153 that opened, the funds-flow calculation threw; it now reads, quotes and exports at every
      depth that opens. A browser's limit differs from jsdom's.
    - The saved appropriation selection shaped the same ways ("om", [], ["xx"]) still reads as all appropriations, with
      nothing said, and counts money from appropriations the file does not name (ledger U45).
    - Saved prime-match text or a category name holding U+FFFF: the funds-flow export is now refused, naming the
      cell, by U37's commit (below; ledger U46, closed there). This fix covers only the quote of the saved year
      selection.
    - A click on the year buttons replaces what could not be read, as the notice says. The earlier text survives only in
      the file's own history.
    - The suite opens each shape from the saved file. A probe also reopened each from this browser's storage alone, where
      every malformed shape was read and said the same way (totals there leave out FY25's executed rows, which live in the
      file only). The shared folder's copy, a PMO copy and a batch import carry the same stored value to the same readers,
      but were not opened here. How the board writes the selection was checked in every version from `09cf071` on; earlier
      history is not in the repository.
    - Not covered either: a locked-cycle view; Chromium (jsdom only); whether the longer label fits the 1,280-pixel chart
      image.
- **U36: an RCN / EEIC title over 80 characters is refused, never cut** (from the registry-text review, first filed as U35
  while Codex's registry-text findings had not reached the lead; Brad, 12 Oct, about 6:05 PM ET: "record the malformed
  saved-year selection and pending registry-text findings explicitly. If deferred, name their limits in the matrix and
  release notes."). Registry text was checked on `d66dd60`: typed (rcnSet, flowSetEnt), in a file opened, saved and reopened,
  and through Import a full board; and where it goes out: the screen, the workbooks read from their bytes (exportExcel,
  exportSrc, exportFlow), the slide deck read from its bytes (exportPPT), and the saved file. The routes not followed are
  listed under "Not covered". One defect was clear enough to fix. A title typed into the RCN / EEIC list (Setup › Codes and
  structure › RCN / EEIC) longer than 80 characters was cut to its first 80, and nothing said so. The cut counted the two
  halves an emoji is stored as, so 79 letters and an emoji were kept as 79 letters and half the emoji; RCN-EEIC by Month then
  printed a replacement mark (�), and the saved file kept the half. Any edit of a title that arrived in a file longer than 80
  cut the file's title the same way, and the next save kept it cut. The title now follows item 91's rule for codes. It is
  refused, and the list keeps what it had. The field keeps what was typed, marked, and the status line says: "⚠ RCN / EEIC
  title not changed. The title “…” is 81 characters; it can be at most 80. Nothing was changed." Nothing is saved on a
  refusal. Once a value is then kept in the list (the title corrected in its field, or an RCN or EEIC typed in any row), that
  refusal leaves the status line, so the line never says "not changed" of a title that has just changed; any other message
  on the line stays. The limit is counted by Unicode code point: an emoji stored as two halves counts once, but a joined
  emoji (a family, a skin tone), a flag, or a letter written with a separate accent mark counts as several, so the number in
  the status line can be larger than the characters a reader sees.
  - **What users may see:**
    - A title over 80 characters is refused where it used to be shortened. A title of up to 80 characters that includes an
      emoji is kept whole.
    - A title that arrived in a file longer than 80 is kept whole and saved whole (U38), but it can be edited only once it is
      shortened to 80. Before, any edit cut it to 80 without a word.
    - A refused title stays in its field only until the panel is next drawn (Add a combination, a service box, another
      row's code): the field then shows the kept title again. The refusal stays on the status line until a value is kept in
      the list or the board says something else. A service box or Add a combination does not clear it: the line then still
      describes the refused title ("… Nothing was changed"), although the list itself has since changed. Item 91's own
      code refusals are not cleared this way, as before this change: after an RCN or EEIC is refused and then corrected in
      its field, the corrected code is kept while the line still reads "RCN not changed … Nothing was changed" until the
      board's next message.
  - **Test:** audit-recon "v2.00 (U36) — an RCN / EEIC title over 80 characters is refused, never cut" (24 checks). Refused,
    each with the status line's exact words: 81 letters, 200 letters, 80 letters plus an emoji, 81 letters typed with spaces
    before them (counted and quoted as kept, trimmed), 41 letters each written with a separate accent mark (82 code points),
    and 100 other letters typed over a file's 100-letter title (the field shows all 100 first; the file's title is kept,
    and kept through a save and a reopen). Also checked: the workbook after those refusals; a refusal saves nothing (the
    board is not marked changed, and its save stamp does not move); 79 letters plus an emoji, kept whole in the list, in
    the workbook, and through save and reopen; the panel's own title field, marked; and a title refused in the panel's
    field and then corrected there: kept, drawn again unmarked, and the refusal gone from the status line. Ten controls: 80
    letters; 80 letters with spaces around them; a padded title, kept trimmed; a title of markup with a leading =, kept and
    printed in the workbook as that exact text; a title within the limit typed in the panel, saved (the board marked
    changed, its save stamp moved) and drawn again, the field having no maxlength; a cleared title, kept empty; two spaces
    inside a title, kept; a message other than the title's refusal, left on the line when a title is kept; and an RCN typed
    as "=1+1" and an EEIC typed as "@a1", kept and printed in the Spend Plan Source as text cells of exactly that text, with
    no formula in any part of the file. 14 checks fail on the board before this change (`d66dd60`); the 10 controls pass
    on both. Every one of audit-recon's 306 existing checks gives the same verdict and the same observed value before and
    after.
  - **Mutations:** `v200-regtext-title-no-limit`, `-title-cut`, `-title-halves`, `-refused-but-kept`, `-field-unmarked`,
    `-count-untrimmed`, `-preview-untrimmed`, `-refused-but-saved`, `-kept-unsaved`, `-kept-not-drawn`, `-field-maxlength`,
    `-count-glyphs`, `-count-normalized`, `-empty-refused`, `-spaces-collapsed`, `-file-title-shown-cut`,
    `-long-title-retyped`, `-refusal-left-standing`, `-clears-any-message` and `-formula-cells`. The focused block catches
    each one. Full-suite sensitivity runs in the final-tree queue.
  - **Not covered** (the registry-text limits, each with its row in `recovery/v200/UNRESOLVED-LEDGER.md`):
    - **U37:** fixed by its own commit (below).
    - **U38 (P3 for the board; P2 proposed for the Spend Plan Source).** A file can carry RCN / EEIC text that typing would
      refuse or change, and the board keeps it as it arrived:
      - an EEIC in lower case, or padded with spaces;
      - an EEIC of ten "ß" (20 characters once upper-cased), which is not listed as over its limit;
      - an RCN padded with spaces;
      - a title of any length up to the import's 200,000 characters, printed whole. The refusal's words "it can be at
        most 80" are true for typing only: such a title is kept and not flagged.
      A 20-character EEIC is listed under Pre-flight's "Codes longer than their limit", as item 91 intends. By code,
      Needs attention does not list it, because it skips board-level lists. Nothing inside the board compares RCN or EEIC
      text, so no figure on the board moves. The Spend Plan Source, the file that goes to CCaR, prints such codes as they
      are stored: a file's RCN " 44444 " and EEIC " ddddd " go out padded and in lower case, and nothing flags them
      (Pre-flight lists nothing). Pre-flight's own reason for flagging an over-long code, "the exports print them as they
      are, so CCaR may not match them", applies to them too. Candidate: list such codes beside "Codes longer than their
      limit".
    - **U39 (P3).** Two RCN / EEIC entries with the same text print identical rows in RCN-EEIC by Month. The money is
      right, but a reader cannot tell the rows apart.
    - **U40: fixed in its own commit (above).** Two destinations of one list, typed with names the board's rule calls the
      same, stay two wherever that list is read in, and a typed name another destination has is refused. Typed destination names are
      still not trimmed and have no length limit.
    - **U42 (fixed in its own commit, above):** the funds-flow sheet names. Still open: the slide deck cuts requirement
      titles the same way (not registry text): its Mission Critical and Unfunded tables keep the first 56 UTF-16 units, so a
      Plan Event of 55 letters and an emoji prints as 55 letters and a replacement mark. By code, the workbook writer also
      cuts every sheet name at 31 UTF-16 units, which the funds-flow names never reach.
    - **U35 (P2, deferred past v2.00 by the lead, 13 Oct, 1:19 PM ET; Codex's A1 finding, not measured by this track).**
      During a Live refresh, typing not yet committed in the RCN / EEIC dialog is replaced by the stored value without a
      question. Nothing already committed is lost.
    - **The refusal's own preview** (`inShow`, shared with item 91) cuts at 60 UTF-16 units, so a title whose 60th unit
      is the first half of an emoji is quoted ending in half of it (status line and tooltip only; nothing stored).
    - **Routes not followed:** importing a cycle file, a PMO copy or submittal, a package, or a service file; BAE budget
      names beyond the hostile sweep that already plants one; Chromium's hostile render with registry text planted (the
      jsdom sweep found every planted registry value drawn as text); a PDF; Excel, PowerPoint or LibreOffice opening any of
      these files, or a cell longer than 32,767 characters. No CSV carries registry text (by code; both CSVs go through
      `csvCell`), and no slide carries registry text (by code). Workbook cells are text, never formulas: no workbook part
      made here held an `<f>` element, including a Spend Plan Source whose RCN cell begins "=" and whose EEIC cell begins
      "@".
- **U41 — an SI code a file carried that is not one of the five is kept, listed and never guessed** (lead, 13 Oct, 1:19 PM
  ET: a fix track from Codex's A4 proposal, joining v2.00 only if both reviews are clean by the time U37's and U40's are).
  Opening a year deleted any SI code that was not exactly LA, EN, OT, FL or AT (for example "at", "LA " or "ZZ") without a
  word, and the next save lost it. The requirement then read its derived code, so on the test fixture an LM prime's
  $1,100,000 was filed under LA in the Special Interest overview, the workbook's SI Codes by Month tab and the CR cash
  return. Only a file ORBIT did not write can carry such a code: the board's own picker writes only the five. Now the code is
  kept exactly as it was saved, opened and after a save, and nothing guesses at it: it is not trimmed, put in capitals or
  replaced by the derived code. On O&M its money is counted under no recognized SI code, and the code is named in Needs
  attention ("🏷 SI codes to repair") and in Pre-flight ("SI codes the board does not recognize"). The requirement's Navy SI
  code field shows it, selected, as "“at” — not one of the five, kept as saved", also on a requirement with no Navy or Marine
  money (which had no field before). Go to it opens that field. Choosing a code there replaces it, and the change journal
  keeps the code as saved. A bulk write counts it as an answer it would overwrite. While such a code is held, the overview's
  no-code row and the workbook's say "no recognized" code, the overview's note says how much of that row is under such codes,
  and the CR cash return's status line counts those rows apart from "no SI code". In a locked cycle's view the code is kept
  and listed; a choice there is refused like any edit in a view, and the line says the requirement keeps the code (it said
  "has no SI code"). Every report that prints SI codes (the CR cash return, the Spend Plan Source, the ACE workbook) leaves
  its SI code blank. On Full Fund, Initial Spares and OPN, where nothing reads an SI code, it is kept and not listed.
  - **What users may see:** only with a file ORBIT did not write. A "🏷 n SI codes to repair" entry under Needs attention
    and a Pre-flight row. Money that was under a derived code is now under "— no recognized code —", with the note saying so.
    The Navy SI code field on a USAF / ANG / AFRC requirement holding such a code. A CR cash return status line that counts
    those rows apart.
  - **Test:** audit-recon "v2.00 (U41) — an SI code a file carried that is not one of the five is kept, listed, counted under
    no recognized code and chosen again in its field" (42 checks). The fixture: an O&M file holding "at" on an LM prime
    (derived LA) and "ZZ" beside the five codes, a blank by hand and a derived EN; nine requirements, $1,910,000 on STOVL /
    USMC CV / USN. Opened, and after a save and reopen: the stored map, the codes read, Needs attention (its strip entry, list
    and Go to it), Pre-flight, the bulk write's question, the overview's rows ($1,210,000 = 63.4% under no recognized code, LA
    only R3's $50,000) and note, the workbook's SI tab from its bytes, and the CR cash return's SI cells and status. Then AT
    and none chosen in the field, saved and reopened: the list empties, the money moves to AT, the rows say "no SI code set"
    again, and the journal holds "at" → AT. Also "LA ", "la", "__proto__", 7, {"x":1} and null kept and listed, Full Fund
    keeping and not listing, a USAF / ANG requirement given the field, and a locked cycle's view keeping the code and refusing
    a choice. 33 checks fail on the board before the change; the 9 controls pass on both.
  - **Mutations:** `v200-u41-dropped-on-opening`, `-derived-guess`, `-capitals`, `-trim-known`, `-unlisted`,
    `-listed-off-om`, `-no-field`, `-field-shows-none`, `-bulk-blank`, `-strip-silent`, `-preflight-silent`,
    `-goto-row-only`, `-overview-label`, `-overview-note-none`, `-workbook-label`, `-cr-counts-twice`, `-cr-silent`,
    `-cr-too-dangling`, `-cr-every-row` and `-view-says-none`. The focused block catches each one.
  - **Not covered:** a PMO submittal or proposal carrying such a code is still left out at the portfolio board's door and
    named there (`pmoNorm`, unchanged), and a PMO copy published from a board holding one carries it in its baseline as saved.
    A requirement removed while it holds one keeps it, unlisted, until restored (seen in a probe, not a suite check). Nothing
    offers the nearest of the five as a choice: a person picks. Initial Spares and OPN take Full Fund's path by code (only
    Full Fund was run). The label cuts a code longer than 60 characters for display (`inShow`), as it does for other codes.
    jsdom only; no browser, Excel or LibreOffice was run.
- **U42 — a funds-flow sheet name never ends in half a character or begins or ends with an apostrophe** (lead, 13 Oct,
  1:19 PM ET: the same fix track as U41). On the destination axis each destination gets a sheet named after it, cut to 28
  UTF-16 units (26 when it numbers a repeat). A cut through an emoji left its first half at the end, and the workbook wrote
  that as U+FFFD: a destination named with 27 letters and an emoji became a sheet named with 27 letters and a replacement
  mark. A name beginning or ending with an apostrophe, or one the cut left ending with one, became a sheet name a
  spreadsheet may not have. Now a cut that would end on the first half of a two-part character leaves that half out (in the
  first cut and in a repeat's), and an apostrophe or space at either end of a sheet name goes. The lengths are as before,
  every other name is exactly what it was, and an apostrophe inside a name (O'Brien) stays. Only the sheet name changes: the
  destination's name in the board and in the workbook's cells is never cut.
  - **What users may see:** a destination sheet named "Quoted depot" for 'Quoted depot', and one character shorter where an
    emoji fell on the cut ("EEEE… 2" where it was "EEEE…� 2").
  - **Test:** audit-recon "v2.00 (U42) — a funds-flow sheet name never ends in half a character or begins or ends with an
    apostrophe" (18 checks): seven destinations added by hand (27 D's and an emoji; 'Quoted depot'; two names whose 28-unit
    cuts match, the first keeping its emoji whole and the repeat's 26-unit cut ending on the first half; 27 F's then an
    apostrophe; O'Brien; Plain depot), the sheet names read from `xl/workbook.xml` in the workbook's bytes, on the working
    board and after a save and reopen. No U+FFFD in the part, no name beginning or ending with an apostrophe, every name 31
    units or fewer and unique, the part parses; the money (TOTAL FUNDING $1,100,000, R1's two service rows on its
    destination's sheet) and the seven names in the board's data unchanged. 8 checks fail on the board before the change;
    the 10 controls pass on both.
  - **Mutations:** `v200-u42-half-first`, `-half-repeat`, `-wrong-half`, `-edge-apostrophe` and `-interior-apostrophe`.
    The focused block catches each one.
  - **Not covered:** whole grapheme clusters (an emoji joined from several, a letter with a combining mark, a flag) can still
    be split between their code points. That is well-formed text, not U+FFFD. A name that itself holds half a character (a
    lone surrogate a file can carry; no cut involved) is still written as U+FFFD, and U37's refusal does not take it (see
    README, probe P5). Other sheet names cut at 31 units are unchanged: the workbook writer's own cut (`buildXlsx`), the
    five-year export's PMO tabs (`fydpPmoSheets`), the board workbook's PMO tabs (`exportCSV`) and the Priority drill's
    "PMO " sheets, all named after a PMO; no funds-flow name reaches 31. The slide deck's 56-unit cut of a requirement
    title can still split an emoji (found by the registry-text track; not a sheet name). A sheet named "History", which
    Excel reserves, is not prevented. Excel itself was not run.
- **U3 — a Save asked for during the mixed-import hold is refused at once, never queued** (the lead's decision on 12 Oct,
  under Brad's "Don't wait for me. Let's keep pressing throughout to get this next version published.", about 5:30 PM ET;
  Brad's R4b contract, 11 Oct: "a Save requested while the mixed-import hold is already active must refuse immediately,
  before file access. Clearing the hold later must not resume that refused request."). A Save asked for while the hold was
  on and another save was running was queued, not refused: the board said "⏳ A save is already under way — this one runs
  as soon as it finishes", and the hold was checked only when its turn came. If saving was allowed again first ("allow
  saving again…", answered yes), it ran and wrote: on the board file, the imported Full Fund plan, from the mix, over the
  one whole copy of the board as it was; in the shared folder, another write and another history copy. The same held for
  every way a save is asked for: 💾 Save, Take the pen (which also read the file or the folder's copy and asked first, even
  with nothing else saving), ⬆ Publish now, Save yours over theirs, Load theirs and the quiet autosave. Now each of them
  checks the hold when it is asked for, before it waits its turn, before anything is read or asked, and refuses at once in
  the words of its own path; allowing saving again later does not bring it back. The checks at the start of each save's
  turn, and R4's after the read, stay: a save asked for before the hold, still waiting when the hold comes, is refused
  when its turn comes if the hold still stands then, before the file or the folder's copy is read. If saving is allowed
  again before its turn, it runs at once and writes, as the question that allows it warns ("The next save writes the board
  on screen, and that mix for the other appropriations, over the board file").
  - **What users may see:** with the hold on, 💾 Save, ⬆ Publish now, Save yours over theirs, Load theirs and Take the
    pen are refused at once, also while another save is running: "⛔ Saving to the board file is refused." (the board
    file), "⛔ Writing to the shared folder is refused." (working out of the shared folder), "⛔ Choosing between the copies
    is refused." (Save yours over theirs, Load theirs), "⛔ Taking the pen is refused.", each followed by the hold's own
    explanation and its buttons. They no longer say "⏳ A save is already under way — this one runs as soon as it
    finishes". Once saving is allowed again, the Save is pressed again. Take the pen no longer reads the board file or the
    folder's copy, or asks whether to take the pen, while the hold is on. The quiet autosave is refused at once and says
    nothing: the import's own message, with its buttons, stays on the message line. Before, behind a save under way, it
    said "⏳ A save is already under way — this one runs as soon as it finishes" over that message, and when its turn came
    it was refused without a word, or, if saving had been allowed again meanwhile, it wrote the folder's copy. With no hold,
    nothing changes: a Save asked for during another waits its turn and writes after it.
  - **Test:** audit-import "v2.00 (U3) — a Save asked for during the mixed-import hold is refused at once, never queued"
    (62 checks). Save A is held at the close of its write; the import stops part-way and cannot be put back; B is asked
    for; saving is allowed again; A is let go. B is the board file's Save (`saveInPlaceFile()`), 💾 Save and Take the pen
    on the board file, and 💾 Save, ⬆ Publish now, Save yours over theirs and Load theirs working out of the shared folder.
    Each B is over at once, touches, reads and asks nothing more, is not queued, says it is refused, and is not brought
    back: A alone wrote, and the board file holds no imported plan (`perm 1 · read 1 · open 1 · writes 1`, Full Fund
    `OLD`). The quiet autosave asked for the same way is over at once, reports no save, leaves the import's message as it
    was, and is not brought back (the folder's copy written twice in all, by the first save and A, and no more history
    copies). Take the pen with nothing else saving, on the board file and from Alice in the shared folder: nothing read,
    opened or written, nothing asked, "Taking the pen is refused". Controls: asked for again once saving is allowed, Save
    writes; with no hold, B waits its turn and writes after A (`perm 2 · read 2 · open 2 · writes 2`); a Save asked for
    before the hold is refused when its turn comes while the hold still stands, before the file or the folder's copy is
    read (kept behaviour: it passes before the change too). 27 checks fail on the board before the change
    (`fce8a391`): three for each B (it waits its turn, says nothing of the hold, and once saving is allowed it writes: on
    the board file `writes 2` and Full Fund `NEW`, Take the pen having read the file again and asked first; in the folder,
    one more write and one more history copy, two for Save yours over theirs, and Load theirs reads the folder's copy
    again), two for the autosave (it says it waits its turn, over the import's message, and then writes: `[3, 1]`) and two
    for each idle Take the pen (it reads the board file or the folder's copy and asks). Every control passes on both.
  - **Mutations:** `v200-u3-save-queued`, `-save-file-words`, `-file-queued`, `-publish-queued`, `-resolve-queued`,
    `-pen-reads-first`, and from the fix round `-autosave-queued`, `-autosave-loud`, `-pen-idle-reads` and
    `-theirs-queued`; each caught by the focused block, from the U3 board and from the U4 board alike (failing 6, 1, 3, 5,
    6, 7, 2, 1, 4 and 3 checks, in that order).
  - **Which check now catches two older mutations.** Nothing in an existing check or fixture changes, and every existing
    check of the audit-import blocks on these paths passes on this board with the same values (focused runs). But a Save
    asked for under the hold is now refused before its turn, so the checks at the start of the turn are reached only by a
    save asked for before the hold: `impmixed-file-unguarded` is no longer caught by R4b's before-file-access checks (R4b
    still passes; R4b's entry gets one added line, below), and `impmixed-folder-unguarded` no longer by the v1.95 and
    v1.99 hold blocks' folder checks (both still pass). Each is caught by one check of this block's "asked for before the
    hold" cases (a permission request and a read of the board file, or a read of the folder's copy, where none is
    expected). The other ten existing hold mutations are caught on the final board (U4's) as follows:
    `impmixed-not-marked` by the v1.95 hold block ("after an import that cannot be put back, nothing writes over the board
    file until asked"), R4, R4b, this block and U4's; `impmixed-not-kept`, `-clear-unasked` and `-boot-silent` by that
    v1.95 hold block (`-not-kept` also by the lifting block); `impmixed-never-lifted` and `-lift-partial` only by the v1.95
    lifting block ("an import that lands whole lifts the hold a stopped one set"); `v200-r4-no-recheck`, `-held-quietly`
    and `-said-not-held` by R4; `saves-not-serial` by this block's no-hold and before-the-hold cases (five checks), and in
    the file-save blocks by the same five checks of the v1.95 "Save acknowledges exactly what it wrote" blocks, on the
    board before the change and on the build's U4 board (`x11`, `x10`; not re-run on this board). Measured with the v1.95
    hold, the lifting, the v1.99 batch hold, R4/R4b, U3 and U4 blocks (`fx-f2-*`, 13 Oct, 8:18–8:47 PM ET).
  - **Not covered:**
    - a save asked for before the hold and still waiting when saving is allowed again: it runs at once and writes the
      mix, without Save being pressed again (as the question that allows saving warns, but it does not say that a save is
      waiting);
    - a save already running when the hold comes. Its bytes were built before the import, so they carry no mix, but it
      lands and says "Saved" over the import's message (and, if the import wrote to storage meanwhile, "A change made while
      it was saving is not in the folder yet — it is saved next time" or "💾 Save again to write it", though the next save
      is refused while the hold stands and the change is the import's own); the import's rescue buttons come back only
      with the next refused save. The folder save's window before its write is U4, next; the board file's own write
      (after R4's check) and the folder's write itself are not checked again;
    - a hold that comes while Take the pen reads or asks meets this check in its Save, after the question was answered
      (by the code; not run).
    ⬇ Save a copy is never refused, by design.
- **U4 — the folder save checks the mixed-import hold after its read and before its write** (the lead's decision on 12 Oct,
  under Brad's "Don't wait for me. Let's keep pressing throughout to get this next version published.", about 5:30 PM ET).
  `_driveStorePushRun` checked the hold once, at its start, before it read the folder's copy. A full import that stopped
  part-way during that read, and could not be put back, set the hold, and the save went on: it built its bytes then, wrote
  them over the folder's copy, marked the board saved, and said "✅ Saved O&M FY27 to the shared folder", with the hold on
  (the quiet autosave wrote the same way, said nothing and reported a save). The same import stopping while the save kept
  the folder's copy in the history (the last wait before the write) let the save write too, over the import's own
  message, and a Take the pen held there took the pen. Save yours over theirs and Load theirs (`_driveResolveRun`) read
  the folder's copy as well and checked the hold only before that read: an import that stopped part-way during the read,
  or while their copy was being kept in the history, let Save yours over theirs ask, keep their copy and record it as the
  copy being replaced; its own save was then refused, but once saving was allowed again the autosave wrote over their copy
  without asking (their copy stayed only in the history). Load theirs loaded their copy over the board. Now the folder save
  checks the hold again after its read and again after its history copy, just before it writes; Save yours over theirs
  and Load theirs check it again after their read, and Save yours over theirs again after keeping theirs, before it
  records the choice. Held, nothing is written over the folder's copy; a history copy already kept stays; a pen line the
  save wrote is taken back, and the board's stamp, which the header shows as when it was saved and by whom, goes back to
  what it was unless something was typed meanwhile; their copy is not recorded as decided, so the next save offers the
  choice again. The board says writing to the shared folder, or choosing between the copies, is refused, and why; a quiet
  autosave says nothing, as at its start.
  - **What users may see:** in that race, instead of "✅ Saved": "⛔ Writing to the shared folder is refused. A full import
    stopped part-way in this browser and could not be put back …", or "⛔ Choosing between the copies is refused. …", with
    the hold's buttons. The work stays unsaved; the folder keeps its copy; once saving is allowed again, 💾 Save writes it,
    or, after a colleague's newer copy, offers "Load theirs / Save yours over theirs" again. If the import stopped during a
    history copy, the folder's history holds one more copy (of the folder's own copy, or of theirs) until a later save
    thins it.
  - **Test:** audit-import "v2.00 (U4) — the folder save checks the mixed-import hold after its read and before its write"
    (43 checks): 💾 Save held at its read of the folder's copy, and at the close of its history copy, with the import
    stopping part-way there: nothing written over the folder's copy (it keeps its bytes), nothing kept in the history when
    held at the read and the folder's copy as read kept once when held at the history copy, refused and not "Saved", the
    note unsaved and the stamp as it was; Take the pen from Alice held at its history copy: nothing written, Alice still
    holds the pen, no journal line saying Brad took it, the stamp as it was; a note typed while the history copy is kept
    keeps its own stamp; the quiet autosave held at either wait writes nothing, reports no save and leaves the import's
    message as it was; the header's saved time (its tooltip) stays what it was before the save (the stamp set to 5 Jan
    2026 first). Save yours over theirs held at its read (nothing asked, kept, written or recorded) and at the close of the
    copy of theirs it keeps (asked before the hold; theirs stays in the history; nothing written or recorded), and Load
    theirs held at its read (nothing loaded or recorded: Brad's note on screen, not Bob's): each says choosing between the
    copies is refused, and once saving is allowed again the autosave writes nothing, Bob's note stays in the folder's copy
    and the choice is offered again. Controls: the same holds with nothing happening there write once and say Saved (Save
    yours over theirs: asked once, theirs in the history, yours written); once saving is allowed again, 💾 Save writes the
    note. 24 checks fail on the board before the change (`fce8a391`) and on the U3 board: each held save writes
    the folder's copy and says "✅ Saved" with the hold on (the autosave writes, reports a save and says nothing); Take the
    pen leaves Brad the writer and a journal line saying he took it; the header shows the time of the save; Save yours over
    theirs asks, keeps their copy and records it, and the autosave then writes over Bob's copy (`["true",0,1,"",false]`);
    Load theirs loads Bob's copy. Every control passes on all three; three checks marked "kept behaviour" pass on all three
    by design.
  - **Mutations:** `v200-u4-read-unchecked`, `-hist-unchecked`, `-stamp-moved`, `-pen-line-kept`, `-hist-says-nothing`,
    and from the fix round `-read-loud`, `-hist-loud`, `-hist-says-saved`, `-stamp-over-edit`, `-header-stale`,
    `-resolve-read-unchecked` and `-resolve-kept-unchecked`; each caught by the focused block (failing 2, 9, 3, 1, 3, 1,
    1, 1, 1, 1, 4 and 3 checks, in that order; `-read-unchecked` now also fails the autosave-at-the-read case, which
    counts history copies).
  - **Not covered:**
    - the write itself (an import stopping while the folder's copy is being written: the bytes were built before the
      import, so they carry no mix, but the save lands and says "Saved", and, the import having written to storage
      meanwhile, "A change made while it was saving is not in the folder yet — it is saved next time", though the next
      save is refused while the hold stands and the change is the import's own; the line replaces the import's message
      and its rescue buttons, which come back with the next refused save); the board file's own write after R4's check,
      likewise ("💾 Save again to write it");
    - after Save yours over theirs has recorded the choice (before the hold), a hold that comes during the save it then
      runs stops that save (above), and the choice stands: once saving is allowed again, the next save writes over their
      copy as chosen (theirs is in the folder's history; by reading the code, not run).
    With U18 (below), this check comes after U18's second read of the folder's copy, which is the last wait before the
    write.
- **U10 (1 of 12) — a refusal in a locked cycle's view puts back the whole view, not the year alone** (a release blocker
  the lead chose to fix on Brad's word of 12 Oct, about 5:30 PM ET: "Don't wait for me. Let's keep pressing throughout to
  get this next version published."). With a locked cycle on screen, a write the view refuses put back the year on screen
  and nothing beside it. An edit that changes what the board holds beside that year stayed on the view's copy after the
  board said "the change was not kept", and every export taken from the view carried it: 77777 typed into PB27's RCN field
  filed PB27's dollars under 77777 / AAAAA in RCN-EEIC by Month, the Spend Plan Source and the ACE tie-out, all labelled
  LOCKED VIEW (the review of `main` `f9b4413`; reproduced on `e635775`, `4a6f7c7` and `7ee498a`). The same held for an
  EEIC, a title, a ✕, + Add, a service box, a PMO renamed, a held year's pointers cleared by a ✕, the list of a cycle locked
  before v1.99 (which reads today's), the band ladder, the funds-flow settings, the funds flow's partner and FMS money and
  its year selection (ledger U49: International Partners $3,000,000 typed for FY27 in PB27's view, refused, was still
  counted -- TOTAL FUNDING $503,000,000 in the calculation and in the funds-flow export named "… [PB27 LOCKED].xlsx", and
  $543,000,000 with FY25 clicked as well -- money neither the lock nor the plan held), a PPBE position, and a CCaR Records
  file imported in the view (its titles and OPRs are kept beside the years, in the records index, and the Spend Plan
  Source printed them). Now a refusal makes the view's copy again, exactly as the view made it, in one place: the working
  plan set aside, with the cycle's years, its base year and the RCN / EEIC list it kept, on the year that is on screen. The working
  plan and the stored cycle are not written by a refusal. What lives outside the view's copy -- the lists every
  appropriation shares, the Spend Plan's choices, other appropriations' boards, browser storage written directly, files
  handed out -- this commit does not reach: commits 2, 3, 4 and 6 do.
  - **What users may see:** in a locked view, a refused change to something the board keeps with its plan (the RCN / EEIC
    list, the PMO list, the band ladder, the funds-flow axis, years, appropriations, pseudo year, prime rules, categories and
    where the unfunded priority list goes, the partner and FMS money typed in the funds flow, a PPBE position, the CCaR records index) now goes back at once, as the status line already said;
    before, it stayed on the view's copy until the view was left (and, for codes, offices, band names, the funds-flow cut
    and its partner and FMS money, positions and CCaR titles, in every export taken from it). A locked cycle keeps no funds-flow settings and no partner or FMS money of its own: its view, and the funds-flow
    export taken from it, use the working plan's (ledger U53). To export a locked cycle under other funds-flow settings
    or money, set them on the working plan and then view the cycle.
  - **Test:** audit-recon "v2.00 (U10) — a refused edit in a locked cycle’s view changes no code any export carries"
    (27 checks, on v1.98 item 83's board with a second held year and an office ZED): each edit made through the control
    the board renders for it, from a fresh view of PB27; after each, RCN-EEIC by Month (summary, requirements, prime
    contracts), the Spend Plan Source (amount, CLIN, EEIC, RCN, PMO), the ACE tie-out (alignment breakout and mapping, both
    years) and the whole workbook are read from their bytes against the cycle's own codes, typed in the block; FY28 on
    screen; the record's own steps (saved, reopened, viewed, 77777 typed); a cycle locked before v1.99. The status line is
    read at once after each edit (the "Not kept" mark lasts 1.5 s). And "v2.00 (U10) — a refusal in a locked view puts back
    the plan’s settings, the year on screen, the CCaR records and the cycle’s base year" (9 checks): band 0 renamed and
    the funds-flow axis set to destinations, read in the workbook and the funds-flow export; a held FY28 that differs from
    FY27 (R on K4), read in RCN-EEIC by Month; a CCaR Records file, read in the Spend Plan Source; the cycle's FYDP window
    after a refusal when the working base year has moved on. Controls in both: nothing changed, a refused edit to the
    year's own assignments, the cycle store and browser storage byte for byte, leaving the view, an allowed edit on the
    working plan (55555) and the same CCaR file on the working plan, which every export carries. On `7ee498a`, 18 + 4
    checks fail and the 9 + 5 controls pass. (A PPBE position refused in a view is read by commit 3's block;
    partner and FMS money and the funds flow's year buttons refused in a view are read by commit 5's; its appropriation
    buttons, pseudo year, prime rules and categories by commit 9's; where its unfunded priority list goes by commit 10's.)
  - **Mutations:** `v200-u10-reapply-year-only`, `-keeps-list`, `-keeps-years`, `-keeps-pmos`, `-first-year`,
    `-older-keeps-list`, `-wrong-year`, `-keeps-plan-settings` and `-working-base`; each caught by the focused blocks
    (full-suite sensitivity runs in the final-tree queue).
  - **Not covered:** what lives outside the view's copy (commits 2, 3, 4 and 6). The forecast-view export, the PMO Matrix and the
    PowerPoint exports are not read by the blocks (they print offices, which the blocks read in the workbook, the Spend Plan
    Source and the ACE tie-out, and no RCN or EEIC).
- **U10 (2 of 12) — a cost estimate, a BAE list, CCaR records or a destination change is refused in a locked view before
  anything is kept** (the same release blocker, from its review of 13 Oct). The cost estimates, the BAE budget list and
  the destination list are kept once for every appropriation, outside a locked view's copy. Each of their doors wrote its
  list first and then saved, which the view refused: the board said "Not kept" and kept it, in browser storage and in
  every plan. A 2027 cost estimate imported while PB27 was on screen replaced the approved one after "An approved cost
  estimate should not change. Replace it?", and the ACE tie-out and the FYDP Spend Plan then read $4,321,000 instead of
  $900, in the view and on the working plan; a BAE list put its budget names into the Spend Plan Source; a destination
  renamed in the view was renamed everywhere; one removed in the view ("Nothing points at it", asked of the view's copy)
  left the working plan's requirements pointing at nothing, so the funds flow put their money under "not yet assigned".
  Now each of these doors -- Import cost estimate, Import BAE budget list, Import CCaR records, and Setup › Destinations'
  name, kind and terms fields, + add, ✕ and reset -- is refused while a locked cycle is on screen, before the file is read
  or a question asked, and says so ("🔒 Importing a cost estimate is off while PB27 is on screen … the change was not
  kept"), as the service list already was. The CCaR records index was already put back by commit 1; its door is refused
  up front so the status line no longer counts titles found and says "Save to bake this into the file". (An import started
  on the working plan while a view is put on screen during its read is refused once the file is read: commit 4.)
  - **What users may see:** with a locked cycle on screen, these imports and the destination list are refused with that
    line, as Save and the service list are; leave the view to use them. On the working plan nothing changes.
  - **Test:** audit-recon "v2.00 (U10) — a cost estimate, a BAE list, CCaR records or a destination change is refused in
    a locked view before anything is kept" (27 checks), on a board of two AV requirements with an approved 2027 estimate
    and the funds flow cut by destination: each of the seven doors used with PB27 on screen (the file pickers' handlers
    with workbooks the board builds; the destination doors through the controls Setup › Destinations renders); after each,
    the status line, the questions asked, the three lists in the board and in browser storage, the panel, and the cells of
    the ACE tie-out, the FYDP Spend Plan, the Spend Plan Source and the funds flow, in the view and again on the working
    plan after leaving, every figure typed in the block. Controls: PB27 viewed with nothing done, the working plan with
    nothing done, and each kind of door open on the working plan (the approved estimate replaced after its question, the
    BAE list kept, a destination added and named), which every export carries. On `7ee498a` 21 checks fail and the 6
    controls pass; on commit 1 the same 21 fail. (A destination's kind changed in a view is read by commit 3's block; that
    the three imports are refused before their file is read is read by commit 4's.)
  - **Mutations:** `v200-u10-ace-import-in-view`, `-bae-import-in-view`, `-ccar-import-in-view`,
    `-dest-change-in-view`, `-dest-change-no-redraw`, `-dest-add-in-view`, `-dest-remove-in-view` and
    `-dest-reset-in-view`; each caught by the focused blocks (full-suite sensitivity runs in the final-tree queue).
  - **Not covered:** a destination's match terms (the same gate as its name and kind; read by code, no block types one).
- **U10 (3 of 12) — a Spend Plan choice is refused in a locked view before anything is kept** (the same release blocker,
  from its round-2 test review of 13 Oct). The Spend Plan's choices -- its Cost data (the estimate the ACE tie-out ties
  out), By PMO / By Service, the two prior years, the PMO and service filters and the PMO drill's service -- were set on
  the page first and then saved, which a locked view refuses. The board said "the change was not kept" and kept the
  choice on the page: with PB27 on screen, 2026ACE chosen as the Cost data made the ACE tie-out taken from the view tie
  out 2026ACE ($333 against A's $1,100, where PB27's 2027ACE is $900), and back on the working plan its ACE tie-out still
  tied out 2026ACE, even after a save, while browser storage kept 2027ACE (so the export no longer matched what the board
  keeps). The same on `7ee498a` and on U10 1 and 2. Now each of the six choices is refused while a locked cycle is on
  screen, before it is set, and says so ("🔒 Changing the spend plan is off while PB27 is on screen … the change was not
  kept"), as the imports and the destination list are.
  - **What users may see:** with a locked cycle on screen, the Spend Plan's choices (Cost data, By PMO / By Service,
    ◀ prior 2 FY, the PMO and service filters, the PMO drill's service) are refused with that line; leave the view to
    change them. They stay as the working plan had them. On the working plan nothing changes.
  - **Test:** audit-recon "v2.00 (U10) — a spend-plan choice, a PPBE position or a destination’s kind refused in a
    locked view leaves no trace" (9 checks), on a board of two AV requirements with two approved estimates (2027ACE $900,
    2026ACE $333) and USAF's FY27 PPBE position logged at $1,000: each choice made through the control the Spend Plan
    renders (the filters and the drill through the handlers their controls call), then the Spend Plan as drawn, the ACE
    tie-out's mapping and reconciliation cells, in the view and on the working plan after leaving, and browser storage.
    It also reads two things U10 1 and 2 put right that no block read: a PPBE position typed in the view (the FYDP Spend
    Plan's By Service position cell) and a destination's kind changed in Setup › Destinations (the list and browser
    storage). Controls: PB27 viewed with nothing chosen; the Cost data choice on the working plan, kept and tied out
    ($333); no jsdom errors. On `7ee498a` 6 checks fail and the 3 controls pass; on U10 2 of 12 the 4 Spend Plan checks
    fail.
  - **Mutations:** `v200-u10-sp-choice-in-view`, `-sp-ace-in-view`, `-sp-by-in-view`, `-sp-pmo-in-view`,
    `-sp-svc-in-view`, `-sp-prior-in-view`, `-sp-drill-in-view`, `-sp-no-redraw`, `-reapply-keeps-ppbe` and
    `-dest-kind-in-view`; each caught by the focused blocks (full-suite sensitivity in the final-tree queue).
  - **Not covered:** a destination's match terms (as commit 2).
- **U10 (4 of 12) — a file, a package, the band ladder or a shared copy is refused in a locked view before anything is
  kept** (the same release blocker, from its round-2 reviews of 13 Oct and the builder's second door scan). Each of these
  doors wrote something that is no part of a locked view's copy -- this appropriation's browser storage, another
  appropriation's board, a list every appropriation shares, the copy kept aside, the shared folder's record -- or handed a
  file out, and only then met the view's refusal, so the board said "Not kept" and kept it. With PB27 on screen:
  - a manager's returned package taken through File › Import one appropriation asked its conflict question of the view's
    copy, wrote the package into this appropriation's browser storage, and said "🔒 Not kept … 📥 Merged O&M package #1 …
    Your local changes were discarded, as confirmed." Reopened, the board carried the package: RCN-EEIC by Month and the
    Spend Plan Source printed 77777 for K1 (11111 in none), and the work typed after the last save was in no copy;
  - a state file carrying cost estimates beside its years kept them (the ACE tie-out read $4,321,000 for $900), and a
    PMO submittal added its destination to the list every appropriation shares;
  - ⇉ Copy to the other appropriations replaced Full Fund's own band ladder, kept nowhere, so its banded requirements
    became unbanded;
  - a package issued, the baselines pushed, a manager's return saved, or an appropriation sent back from the
    consolidated handed out the locked cycle as the board's package (the return under the issue's own number and
    signature, though "Not kept" was said);
  - loading the shared state file kept the locked cycle aside as this browser's work ("put it back" would make it the
    working plan);
  - a Live refresh that found a colleague's newer copy in the shared folder kept the locked cycle aside in place of this
    browser's unsaved work, and recorded the folder's copy as the one the work came from, saved: the first refresh after
    leaving the view then loaded the colleague's copy over that work, which was kept nowhere;
  - and a cost estimate, BAE list or CCaR file whose import started on the working plan, with the view put on screen while
    the file was read, was kept as the other imports were before commit 2 (the approved estimate replaced: $4,321,000
    for $900).
  Now Import one appropriation is refused while a locked cycle is on screen before the file is read, and again once it is
  read, as Import several boards is (Import full board is refused before its file is read; see Not covered); the three
  workbook imports are refused again once their file is read; the ladder copy, the four package doors and loading the
  shared state file are refused up front; and a refresh from the shared folder loads none of this appropriation's plan
  and keeps nothing aside while a locked cycle is on screen (a Connect that finds a newer copy says so; the Live timer
  says nothing), and the first refresh
  after leaving the view decides afresh. A folder copy no newer than what is on screen is answered as before, view or not:
  when it is not the copy the work came from, the clash between the two is drawn, and both its choices are refused in a
  view (U10 6, 8 and 11 of 12); with no copy recorded, it is recorded as that copy (by reading; as off a view).
  Each refusal says so ("🔒 Importing a file is off
  while PB27 is on screen … the change was not kept").
  - **What users may see:** with a locked cycle on screen, File › Import one appropriation, ⇉ Copy to the other
    appropriations, ⬆ Issue, Push baselines, the return and send-back packages, and "load the shared one" are refused with
    that line; leave the view to use them. A colleague's newer copy in the shared folder is loaded by the first refresh
    after leaving the view (with this browser's unsaved work kept aside first, as on the working plan). On the working plan
    nothing changes.
  - **Test:** audit-recon "v2.00 (U10) — a file, a package, the band ladder or a shared copy is refused in a locked view
    before anything is kept" (28 checks), on boards of two AV requirements (A on RCN 11111 / EEIC AAAAA, confirmed on WBS
    1.1; an approved 2027ACE of $900), PB27 locked and then A described on the working plan: the returned package (K1 →
    77777) taken in the view, then on the working plan with the view put on screen while it is read -- the status line,
    the questions, browser storage, RCN-EEIC by Month and the Spend Plan Source after leaving, and the board reopened over
    its saved file; a state file carrying a 2028 estimate -- the estimates in the board and in browser storage, and the
    ACE tie-out; each workbook import with the view on screen (the file is read 0 times) and started on the working plan
    with the view put on screen during the read -- the lists and the ACE tie-out; the ladder copy -- Full Fund's stored
    ladder and the ladder held for it; the four package doors -- the files handed out and the package record; the shared
    state file and a Live refresh from a fake shared folder -- what is kept aside, browser storage and the unsaved-work
    flag, then leaving the view and the next refresh. Every figure is typed in the block. Controls: on the working plan
    the return merges (asked first) and every export carries 77777; the state file is taken with its estimate; each
    package door hands out the working plan; the ladder copies; the shared state file loads with the work kept aside
    first; no jsdom errors. On `7ee498a` the 22 non-control checks fail and the 6 controls pass; on U10 3 of 12, 19 fail
    (the three workbook imports refused before their file is read already pass there). Three checks commit 6 adds to
    this block read what it does not: a Live refresh started on the working plan with the view put on screen while the
    folder's copy is read, the quiet refresh's silence, and the shared state file's answer at opening (sharedArrived).
  - **Mutations:** `v200-u10-state-import-in-view`, `-state-import-race`, `-ace-import-race`, `-bud-import-race`,
    `-ccar-import-race`, `-ladder-copy-in-view`, `-pkg-issue-in-view`, `-pkg-push-in-view`, `-pkg-sendback-in-view`,
    `-pkg-return-in-view`, `-shared-load-in-view`, `-folder-pull-in-view` and `-folder-connect-quiet`; each caught by the
    focused blocks (full-suite sensitivity in the final-tree queue). Commit 2's three import entries stay caught (the
    block reads that their file is never read in a view).
  - **Not covered:** the PMO submittal and the consolidated file's take through Import one appropriation (the same
    gate; not typed in the block); the Live refresh's pulls of the folder's execution data and reprogramming log while a
    view is on screen (other people's saved lists, not an edit; read, not measured -- ledger row U51). A full board import
    started on the working plan with a view put on screen during its read lands as on the working plan, after its own
    questions, which still name the working plan's changes (measured; not a refused edit, not changed). Load theirs
    started on the working plan with a view put on screen while the folder is read (commit 6).
    A Connect pressed while a locked cycle is on screen still takes the shared folder's cost estimates, execution data and
    reprogramming log, after the line "🔒 Loading from the shared folder is off while PB27 is on screen … the change was
    not kept": a colleague's 2028ACE taken that way moves the ACE tie-out exported from PB27's view (Spend Plan cost data
    on Board requirements) from 2027ACE's $900 to $4,321 for Req A, and it is still there after leaving the view (the U10
    money review, round 6, probe P1b, 14 Oct; the same pull on `7ee498a`, where the line read "🔒 Not kept — … ⬇ Loaded O&M
    FY27 from the shared folder"). The check named "📡 Connect" in this block calls the folder read alone
    (`driveStorePull(false)`), not the Connect (`driveConnectNow`). Ledger U51.
- **U10 (5 of 12) — partner money, FMS money or a year refused in a locked view is in no total and no export** (ledger U49,
  a release blocker the lead put in U10's track on 13 Oct, 5:17 PM ET; found by the YEARSEL money review, round 3, probe P4).
  With PB27 on screen, International Partners $3,000,000 typed for FY27 in the funds-flow panel was refused ("the change was
  not kept"), and the view's calculation and the funds-flow export named "… [PB27 LOCKED].xlsx" still counted it: TOTAL
  FUNDING $503,000,000 and International Partners 3,000,000. With Foreign Military Sales $2,000,000 typed as well the total was
  $505,000,000, and with FY25 clicked in the year buttons $545,000,000. Neither the lock nor the plan held that money. The
  refusal had put back the year on screen and nothing beside it, and the funds flow's partner and FMS money and its year
  selection are kept beside the years. U10 1 of 12 makes the whole copy again on every refusal, so they are put back; this
  commit reads them, with P4's figures, so that no later change can bring the money back unseen.
  - **What users may see:** nothing beyond U10 1 of 12: in a locked view, partner money, FMS money and the funds flow's year
    buttons are refused and go back at once, as the status line says.
  - **Test:** audit-recon "v2.00 (U10) — partner money, FMS money or a year refused in a locked view is in no total and no
    export" (7 checks), on P4's board: one O&M requirement F1 (PSM, $1,000,000,000 asked), $500,000,000 discretionary in
    FY27, an imported FY25 row of $40,000,000, the funds flow's saved selection FY27; PB27 locked and viewed. International
    Partners and Foreign Military Sales are typed in the fields the funds-flow panel draws, and FY25 is clicked in its year
    buttons. After each: the status line, the calculation, the panel's total funding and fields, and the funds-flow export
    read from its bytes (its name, TOTAL FUNDING, US SERVICE FUNDING, International Partners, Foreign Military Sales); every
    figure is typed in the block. Controls: PB27 viewed with nothing typed; the view left (the working plan holds no partner
    money; the cycle store and browser storage byte for byte); on the working plan the same figure and the same click are
    allowed ($503,000,000, then $543,000,000, each in the export). On `7ee498a` the 3 non-control checks fail ($503,000,000;
    $505,000,000; $545,000,000, each under "[PB27 LOCKED]") and the 4 controls pass; at U10 4 of 12 all 7 pass.
  - **Mutations:** `v200-u10-reapply-keeps-partner-money` and `-reapply-keeps-year-pick` (a refusal that makes the copy again
    but keeps the refused partner money, or the refused year selection); each is caught by this block (3 and 1 checks
    fail) and by no earlier U10 block (the round-3 test review: 0 of 111 fail).
  - **Not covered:** a locked cycle keeps no funds-flow money of its own: partner and FMS money typed on the working plan
    after the lock is counted in the cycle's view and its "[PB27 LOCKED]" export (ledger row U53). The funds flow's
    appropriation buttons, pseudo year, prime rules and categories: commit 9.
- **U10 (6 of 12) — Load theirs is refused once the shared folder is read, when a locked view was put on screen meanwhile**
  (the same release blocker; found by its round-3 money review, 13 Oct, probe P9). Load theirs is what the board offers when a
  colleague saved a newer copy to the shared folder while this browser holds unsaved work. In a view it was refused before the
  folder was read, but not after. Started on the working plan, with PB27 put on screen while the folder was read, it kept the
  locked cycle aside as this browser's work and then said "🔒 Loading a board is off while PB27 is on screen … the change was
  not kept". Back on the working plan, Load theirs was refused ("this browser already keeps earlier work aside … the newer
  copy was not loaded"), and "put it back" made PB27's plan the working plan ("↶ Put back the work kept aside"), with the
  real work swapped into the kept slot. The same on `7ee498a` and on U10 1-4. Now Load theirs is refused again once the
  folder is read, before anything is kept aside or recorded, as the shared folder's refresh is (U10 4 of 12).
  - **What users may see:** a Load theirs still reading the shared folder when a locked cycle is put on screen stops with
    "🔒 Loading a board is off while PB27 is on screen …" and keeps nothing aside; after leaving the view, Load theirs works as
    before. On the working plan nothing changes.
  - **Test:** audit-recon "v2.00 (U10) — a view put on screen while Load theirs reads the shared folder keeps nothing aside"
    (4 checks; the round-3 money review's block, adopted with one comment corrected), on U10 4's board and fake shared folder
    with one hook: reading the folder's copy puts PB27 on screen. Read: the status line, what is kept aside (nothing), and this
    browser's copy (MY UNSAVED A, still unsaved); then, after leaving the view, Load theirs keeps MY UNSAVED A aside first and
    loads Colleague C's copy (COLLEAGUE DESC R). Controls: the folder copy written by the board's own save; no jsdom errors.
    On `7ee498a` and on U10 4 of 12 the 2 non-control checks fail (the cycle kept aside; Load theirs refused after leaving) and
    the 2 controls pass. And three checks in U10 4's block for its shared-folder gates, which no check read: a Live refresh
    started on the working plan with PB27 put on screen while the folder's copy is read (nothing loaded or kept aside, the
    work still this browser's unsaved work), a quiet refresh with PB27 on screen (the status line as it was), and the shared
    state file answering at opening (sharedArrived) with PB27 on screen (refused, nothing kept aside). The first two are the
    round-3 test review's, adopted unchanged; the third is this round's. On `7ee498a` all three fail; at U10 4 of 12 they pass.
  - **Mutations:** `v200-u10-resolve-race` (the new gate taken out: 2 checks fail), `-folder-pull-view-at-start` (the
    refresh reads the view once, when it starts, as a gate checked before the folder is read would: 3 fail),
    `-folder-pull-quiet-speaks` (a quiet refresh says the refusal: 1 fail) and `-shared-gate-in-adopt` (the gate on the
    button's handler instead of `sharedKeepMine`: 1 fail). The last three pass every check before this commit.
  - **Not covered:** "Save yours over theirs" racing a view is refused by the same gate before its question (before, it
    recorded the colleague's copy as the base and then met the push's refusal), but in Load theirs' words: commit 8 names the
    door pressed and types the race (two checks in this block).
- **U10 (7 of 12) — ↶ Put back in the change journal is refused in a locked view before the journal is touched** (the same
  release blocker; found by its round-4 money review, 13 Oct, probe P11). The change journal's ↶ Put back is a write a locked
  view refuses: its save is refused like any other. But before that save it re-took the journal's record of the board as last
  journalled from the copy on screen, which is the locked cycle's plan. The refusal put the copy back and left that record as
  it was. So the first save on the working plan after leaving the view wrote every difference between the cycle and the
  working plan into the journal, as changes made at that moment by whoever saved. Measured on a two-requirement board: PB27
  locked; Colleague C then asks $1,200,000,000 for F1 and writes a note on F1; Me M views PB27 and presses ↶ Put back on
  Colleague C's note (answered OK; "Not kept"); back on the working plan Me M writes a note on F2. The save recorded three
  entries by Me M: F1's note, F1's requirement of $1,200,000,000 and F2's note. The saved board file carried all three, and the
  PPBE cycle's changes table named Me M as the last to change F1. ↶ Put back was offered on the entry saying Me M had asked
  $1,200,000,000 for F1; pressed, it set F1 back to $1,000,000,000. The same on `7ee498a` and on U10 1-6. Now ↶ Put back is
  refused up front while a locked cycle is on screen, as the imports and the package doors are (U10 2 and 4).
  - **What users may see:** with a locked cycle on screen, ↶ Put back in the change journal says "🔒 Putting a change back is
    off while PB27 is on screen … the change was not kept" and asks nothing; on the working plan it works as before.
  - **Test:** audit-recon "v2.00 (U10) — ↶ Put back in a locked view is refused and leaves the change journal as it was"
    (6 checks), on an O&M board of two requirements (F1 PSM $1,000,000,000 asked; F2 PSM $200,000,000): PB27 locked; then
    Colleague C's two changes; Me M presses the ↶ Put back the journal panel draws for Colleague C's note, in PB27's view; back
    on the working plan Me M's note on F2 is saved. Read: the status line and the view (the cycle's F1, the journal as it was),
    the journal entries that save adds (only Me M's note on F2), the journal the board file carries, read from the file's bytes,
    the cycle table's name for F1 (Colleague C), and how many ↶ Put back buttons sit on Me M entries naming F1 (0). Every entry
    and figure is typed in the block. Controls: the fixture; on the working plan the same ↶ Put back is allowed and recorded
    once; no jsdom errors. On `7ee498a` its 3 non-control checks fail; on U10 6 of 12 the 2 after the view fail (U10 1 already
    puts the journal on screen back); the 3 controls pass on both; at U10 7 of 12 all 6 pass (U10 10 of 12 adds a
    seventh: the refusal's own words, and that nothing is asked).
  - **Mutations:** `v200-u10-journal-putback-in-view` (the gate taken out: 2 checks fail). The blocks before this one catch
    nothing of it: they never press ↶ Put back.
  - **Not covered:** the journal's record's other writers -- the service list (`svcSaveList`), a wholesale load
    (`applyStore`) and putting back an earlier copy from the shared folder (`driveRestore`) -- are refused in a view before they
    reach it (read, not typed).
- **U10 (8 of 12) — "Save yours over theirs", raced by a locked view, is refused in a save's words, and the race is
  tested** (the same release blocker; the round-4 money review's SF1 and the round-4 test review's m2, 13 Oct). Save yours over
  theirs pressed on the working plan, with PB27 put on screen while the shared folder's copy was read, was refused by U10 6's
  gate before its question and before anything was written -- but in Load theirs' words, "🔒 Loading a board is off while PB27
  is on screen …", though the person had pressed Save. And no check typed that race: a gate standing before Load theirs only
  passed every check. On `7ee498a` the same race asked "Save your copy of O&M FY27 over the one Colleague C saved …?", wrote
  Colleague C's copy into the folder's history and recorded it as the copy being replaced, and only then met the save's own
  refusal (the round-4 money review, measured on U10 5, whose Save yours over theirs is `7ee498a`'s: the next Save after
  leaving then wrote over Colleague C's copy without asking again; Colleague C's copy stayed in the history). Now the gate names the door that was pressed: "🔒 Writing to the shared folder is
  off while PB27 is on screen …" for Save yours over theirs, as a save racing a view already says (v1.97 W3), and "Loading a
  board" for Load theirs, as before.
  - **What users may see:** Save yours over theirs still reading the shared folder when a locked cycle is put on screen stops
    with "🔒 Writing to the shared folder is off while PB27 is on screen …", asks nothing and writes nothing; after leaving the
    view it asks its question again and saves over theirs, keeping theirs in the folder's history. Load theirs, and everything
    on the working plan: nothing changes.
  - **Test:** two checks added to U10 6's block "v2.00 (U10) — a view put on screen while Load theirs reads the shared folder
    keeps nothing aside" (now 6): Colleague C saves again (COLLEAGUE DESC R2) and MY SECOND A is typed; Save yours over theirs
    is pressed on the working plan and PB27 is put on screen while the folder's copy is read. Read: the status line (typed),
    the questions asked (none), the folder's copy (still Colleague C's), the folder's files (none added), this browser's copy
    (MY SECOND A) and its unsaved flag. Control: after leaving the view the same choice asks once, keeps Colleague C's copy in
    the folder's history and writes MY SECOND A to the folder. On `7ee498a` the race check fails (asked; the history written)
    and the control passes; on U10 6 and 7 of 12 the race check fails on its words alone; at U10 8 of 12 both pass.
  - **Mutations:** `v200-u10-resolve-gate-theirs-only` (the gate before Load theirs only: 1 check fails) and
    `-resolve-mine-words` (Load theirs' words for a save: 1). U10 6's `v200-u10-resolve-race` has its find moved to the new
    line (the gate taken out: 3 checks fail now, the race check among them).
  - **Not covered:** the two earlier gates, `driveResolve`'s own and `_driveResolveRun`'s first, still name Load theirs' door
    for both choices (unchanged from `7ee498a`; nothing is written). Both are reachable: the first by a direct press, from the
    clash a Connect draws while a view is on screen (the round-5 money review, probe P15), the second by a press that waited
    behind another save. U10 11 of 12 names the door pressed at both.
- **U10 (9 of 12) — the funds flow's appropriation buttons, pseudo year, prime rules and categories refused in a locked view
  move no money in any total or export** (the same release blocker; the round-4 test review's MF1 and SF1, 13 Oct). The funds
  flow keeps these settings beside the years, with its partner money (ledger U49's class), and U10 1 of 12 puts them back after a
  refusal -- but no check read them: a refusal that kept O&M clicked out of the appropriation buttons passed all 125 checks of
  U10 1-6, while PB27's view said "the change was not kept" and the funds-flow export labelled "[PB27 LOCKED]" counted no O&M
  money (TOTAL FUNDING 0 for $500,000,000). On `7ee498a` the refused click is kept. This commit reads all four, each with the
  money it moves.
  - **What users may see:** nothing beyond U10 1 of 12.
  - **Test:** audit-recon "v2.00 (U10) — an appropriation button, the pseudo year, a prime rule or a category refused in a
    locked view moves no money in any total or export" (11 checks), on P4's board with a second FY25 row (Carried Support, O&M
    Mandatory, $7,000,000) and the pseudo year set to count Mandatory money appropriated in FY25 as FY27, switched off. In
    PB27's view, through the panel's own controls: O&M clicked out; the pseudo year's button pressed; F1 typed as the Lockheed
    Martin token; F1 typed as Depot, Repair & Materiel's title words; each refused. After each: the status line, the
    calculation and the settings as stored, the panel (total funding, the two fields, the pseudo year's button, ALL
    appropriations lit) and the funds-flow export read from its bytes (its name, Scope line, TOTAL FUNDING, Lockheed Martin,
    Program Operations & Support, Depot Repair & Materiel, the prime token line, Depot's rule line, the pseudo year's NOTE):
    $500,000,000 under Program Operations & Support, every setting as it was. Controls: PB27 viewed with nothing changed; the
    view left; and on the working plan the same four changes allowed one after another, each moving money in the export -- F1's
    $500,000,000 to Depot, then to Lockheed Martin; then FY27 read from the $7,000,000 carried in from FY25 in place of its plan
    ("ORBIT Funds Flow - FY27 all appropriations OBBBA FY25.xlsx", with its NOTE); then O&M out and $0 under "… FY27 FULL FUND
    INITIAL SPARES OPN PLANNED board allocation O M.xlsx". Every figure is typed in the block. On `7ee498a` the 4 non-control
    checks fail (the first leaves TOTAL FUNDING 0 under "… FULL FUND INITIAL SPARES OPN … [PB27 LOCKED].xlsx") and the 7
    controls pass; at U10 6 of 12 all 11 pass (the code is U10 1's). The commit also types 'PB|2027' as the expected cycle in
    the three checks U10 5 and 6 added where the board's own `blKey` value stood (the round-4 test review's m1; no expected
    value changes).
  - **Mutations:** `v200-u10-reapply-keeps-appn-pick` (the round-4 test review's entry; 4 checks fail), `-reapply-keeps-pseudo`
    (3), `-reapply-keeps-rules` (2) and `-reapply-keeps-cats` (1): each a refusal that makes the copy again but keeps that one
    refused setting. None is caught by U10 1-6's blocks (0 of 125: the round-4 test review for the appropriations, the pseudo
    year, and the rules with the categories together; measured here for the rules and the categories each alone).
  - **Not covered:** the funds flow's presentation settings -- the sub-rung lists under a category and which of them are
    shown, the plan-event counts and the layout -- are put back by the same whole copy and read by no check; by reading, none
    of them reaches the funds-flow export or any total (the round-5 test review, m3). The categories' order and reset live in
    the categories the Depot check reads and are not typed on their own. Where the unfunded priority list goes is read by U10
    10 of 12.
- **U10 (10 of 12) — where the funds flow puts the unfunded priority list, refused in a locked view, moves no money in any
  total or export; and ↶ Put back's refusal is typed in its own words** (the same release blocker; the round-5 test review's
  MF1 and SF1, 14 Oct). Where the Unfunded Priority List goes -- counted as a Lockheed Martin line (the default) or held
  outside the flow -- is a funds-flow setting kept beside the years with those U10 9 of 12 reads, and it moves money: counted
  as Lockheed Martin, a UPL row is in the total and in Lockheed Martin's line; held outside, no total holds it. U10 1 of 12
  puts it back after a refusal, but no check read it: a refusal that kept it passed all 144 checks of U10 1-9, while the
  funds-flow export labelled "[PB27 LOCKED]" read TOTAL FUNDING $40,000,000 and Lockheed Martin $0 where the lock and the plan
  hold $43,000,000 and $3,000,000 -- as `7ee498a` does today (the round-5 test review, probe PU-base, 14 Oct 12:30 AM ET).
  And U10 7 of 12's check read the refusal only as "Not kept" and answered its question without recording it, so a Put back
  that asked "Put note — Ev F1 back …?" before refusing, or one that only skipped re-taking the journal's record and then
  said "↶ Put back: note — Ev F1 — recorded in the journal" under the view's mark, passed every check.
  - **What users may see:** nothing beyond U10 1 and 7 of 12.
  - **Test:** audit-recon "v2.00 (U10) — holding the unfunded list outside the flow, refused in a locked view, moves no money
    in any total or export" (6 checks), on one O&M requirement (F1 PSM, $1,000,000,000 asked; $500,000,000 discretionary in
    FY27) with FY25 imported: Ordinary Support (O&M Discretionary, $40,000,000) and Unfunded Ask (O&M Discretionary,
    $3,000,000, on the Unfunded Priority List); the saved selection FY25; the list counted as Lockheed Martin. In PB27's view
    "Hold outside the flow" is chosen with the panel's own radio: refused. Read: the status line, the calculation (total,
    Lockheed Martin, the unfunded list, the part of the total it makes, where it goes, total funding, the years counted, the
    setting as stored), the radio drawn checked, and the funds-flow export from its bytes ("ORBIT Funds Flow - FY25 all
    appropriations [PB27 LOCKED].xlsx": its Scope line, TOTAL FUNDING $43,000,000, Lockheed Martin $3,000,000, unfunded
    requirements $3,000,000, and the NOTE that the total includes 3000000 of unfunded requirements counted under Lockheed
    Martin). Controls: the working plan; PB27 viewed with nothing changed; the view left; on the working plan the same radio is
    allowed and moves the $3,000,000 out of the total (TOTAL FUNDING $40,000,000, Lockheed Martin $0, no NOTE); no jsdom
    errors. And one check added to U10 7's block: ↶ Put back pressed in PB27's view says "🔒 Putting a change back is off while
    PB27 is on screen. It is a locked cycle, read only — the change was not kept. ↩ Leave the view to work the plan." and asks
    nothing. Every figure and word is typed. On `7ee498a` the 2 non-control checks fail ($40,000,000 and $0 under "[PB27
    LOCKED]"; "🔒 Not kept — PB27 is a locked view. ↶ Put back: note — Ev F1 — recorded in the journal." after its question)
    and the 5 controls pass; at U10 9 of 12 all 7 pass (the code is U10 1's and 7's).
  - **Mutations:** `v200-u10-reapply-keeps-upl-place` (a refusal that makes the copy again but keeps where the unfunded list
    goes: 1 check fails; 0 of the 144 checks of U10 1-9, the round-5 test review's run X9),
    `v200-u10-journal-gate-after-question` (U10 7's gate after its question: 1) and `-journal-putback-sync-only` (no gate; the
    journal's record merely not re-taken in a view: 1).
  - **Not covered:** the funds flow's presentation settings (U10 9 of 12).
- **U10 (11 of 12) — "Save yours over theirs" is refused in a save's words at every gate, and Load theirs without keeping
  yours, raced by a view, is typed** (the same release blocker; the round-5 money review's SF1 and the round-5 test review's
  m1, 14 Oct). U10 8 of 12 named the door pressed at the gate after the shared folder is read. The two gates before it still
  said "🔒 Loading a board is off while PB27 is on screen …" for Save yours over theirs, and both are reachable. A Connect to
  the shared folder pressed while a locked cycle is on screen, when the folder's copy is no newer than what is on screen but
  is not the copy the work came from, draws the clash -- Load theirs and Save yours over theirs -- in the view; Save yours
  over theirs pressed there met `driveResolve`'s own gate (the round-5 money review, probe P15, 14 Oct 1:26 AM ET, the same
  on `7ee498a`). And Save yours over theirs pressed on the working plan while a save is under way waits for it; with a view
  put on screen meanwhile it met `_driveResolveRun`'s first gate. Nothing was asked or written either way; the words named
  the wrong door. Now both gates name a save's door for Save yours over theirs, as U10 8's does.
  - **What users may see:** with a locked cycle on screen, Save yours over theirs pressed from a clash a Connect drew, or run
    after waiting for another save, says "🔒 Writing to the shared folder is off while PB27 is on screen …", asks nothing and
    writes nothing. Load theirs, and everything on the working plan: nothing changes.
  - **Test:** five checks added to U10 6's block (now 11). The round-5 money review's: Colleague C saves 5 ms after this
    browser's copy, MY THIRD A is typed, PB27 is put on screen and the folder's Connect is pressed -- CONTROL: the clash is
    drawn in the view with both choices; Save yours over theirs pressed there is refused as a save, asks nothing, leaves the
    folder's copy and its file count as they were, and MY THIRD A still unsaved. Load theirs without keeping yours pressed on
    the working plan, PB27 put on screen while the folder is read: refused as Load theirs is ("Loading a board is off"),
    nothing asked, loaded or written. Save yours over theirs pressed on the working plan while a save is under way --
    CONTROL: it waits ("⏳ A save is already under way — this one runs as soon as it finishes.") -- with PB27 put on screen
    before it runs: refused as a save, nothing asked or written. Every word is typed. On `7ee498a` the 3 non-control checks fail
    (the two Save yours over theirs in Load theirs' words; Load theirs without keeping yours asks "Load …’s copy of O&M FY27
    and replace what is on screen?" first) and the 2 controls pass; at U10 10 of 12 the two Save yours over theirs checks fail
    on their words alone; at U10 11 of 12 all 5 pass.
  - **Mutations:** `v200-u10-resolve-entry-mine-words` (the round-5 money review's: `driveResolve`'s gate in Load theirs'
    words: 1 check fails), `-resolve-queued-mine-words` (the first gate in Load theirs' words: 1) and
    `-resolve-gate-theirs-words` (the gate after the folder read keyed on 'theirs', so Load theirs without keeping yours is
    refused in a save's words: 1). U10 6's and 8's `-resolve-race`, `-resolve-gate-theirs-only` and `-resolve-mine-words` stay
    caught (6, 1 and 1 checks).
  - **Not covered:** the clash itself is still drawn in a view by a Connect, and its words ("What is on screen does not have
    their changes") speak of the working plan while the cycle is on screen (not changed; both its choices are refused there).
- **U10 (12 of 12) — "↶ work kept aside" is refused in a locked view before anything is asked or kept** (the same release
  blocker; the round-5 money review's SF3, 14 Oct, probe P14). The top bar offers "↶ work kept aside" while a locked cycle is
  on screen. Pressed there, it asked "Put back the work this browser kept aside on …? … What is on screen now has changes no
  saved copy has, so it is kept aside in its place — nothing is lost", though what is on screen is the locked cycle; wrote
  the cycle into the kept slot over the kept work; met the view's refusal ("🔒 Loading a board is off …"); and wrote the kept
  work back. The end state was right and nothing was lost, but the question's answer was thrown away, and the kept work
  survived only while that last write to browser storage succeeded (the review simulated it refused: the kept work was gone
  and the slot held the locked cycle, which "put it back" would make the working plan; it does not claim that refusal is
  reachable). The same on `7ee498a`. Now it is refused up front, as ↶ Put back in the change journal is (U10 7 of 12).
  - **What users may see:** with a locked cycle on screen, "↶ work kept aside" says "🔒 Putting back the work kept aside is
    off while PB27 is on screen … the change was not kept", asks nothing and leaves the kept work where it is; on the working
    plan it works as before.
  - **Test:** audit-recon "v2.00 (U10) — “↶ work kept aside” pressed in a locked view is refused before anything is asked or
    kept" (6 checks), on an O&M board of two requirements: PB27 locked; work kept aside (KEPT NOTE on F1, kept when Colleague
    C's copy displaced it); the working plan's own unsaved work (MINE NOTE on F2). The top bar's button is pressed in PB27's
    view (answered OK). Read: the status line (typed), the questions asked (none), every write to the kept slot (none), the
    kept slot and this appropriation's browser storage byte for byte, the cycle still on screen. Controls: the fixture; the
    button drawn in the view; the view left (MINE NOTE on the working plan, unsaved; KEPT NOTE still kept); on the working
    plan the same button asks once, puts KEPT NOTE back on screen and in browser storage and keeps MINE NOTE aside in its
    place; no jsdom errors. On `7ee498a` and at U10 11 of 12 the non-control check fails (the question asked, the slot written
    twice, "Loading a board is off") and the 5 controls pass; at U10 12 of 12 all 6 pass.
  - **Mutations:** `v200-u10-kept-putback-in-view` (the gate taken out: 1 check fails), `-kept-gate-after-question` (the gate
    after its question: 1) and `-kept-gate-silent` (refused without a word: 1).
  - **Not covered:** "save it as a file" and "discard it", offered beside "put it back" when kept work blocks a newer copy,
    act on the kept work in browser storage and are not refused in a view (discarding asks first; not changed).
- **U56 and U57 — a saved SI value that is not text is an answer a bulk write overwrites, and Go to it opens its field**
  (Codex's batch C1b, findings C3-1 and C3-2, as Brad pasted it on 18 Oct at about 6:29 AM ET; the fix is Codex's batch
  C5, pasted at about 7:00 AM ET, adopted on the committed U41 and U10. Not a release blocker: it joins v2.00 only if
  both reviews are clean by 8 PM ET on 18 Oct, Brad's cut). U41 keeps an SI code a file carried that is not one of the
  five exactly as it was saved. Two of the places that read it then put that value through String(), which reads a saved
  list as its contents. The bulk write's question (Requirements matrix, Set Navy SI code) counted a saved [] or [null]
  as "no answer yet" and ["AT"] as "already say exactly this". On the test fixture, AT on three requirements was asked
  as 2 / 0 / 1 for [] (1 / 1 / 1 for ["AT"]) where it is 1 no answer, 0 already AT and 2 overwritten, and the line after
  the write said "1 had a different answer and were overwritten" where 2 were. A saved {"toString":null}, which is valid
  JSON, could not be turned into text at all ("Cannot convert object to primitive value"): the question threw, so no
  bulk write of the Navy SI code could be made; Go to it (Needs attention, SI codes to repair) threw and opened no
  field; and selecting that requirement's row and opening the Requirements matrix threw too, drawing nothing (probe
  P2b). The field's "kept as saved" choice also took its value from String(): "AT" for ["AT"], the AT choice's own
  value, and "" for [], the value of "— none —". Now neither place puts the saved value through String(): text is read
  as it is, anything else by its JSON as Needs attention and Pre-flight already show it (“[]”, “["AT"]”,
  “{"toString":null}”). Such a value is counted as an answer the write overwrites, the line after the write counts it,
  and Go to it opens the Navy SI code field with it selected as "“{"toString":null}” — not one of the five, kept as
  saved". Choosing that choice again writes nothing, as for text. No dollar moves: what the write stores is unchanged,
  the overview, the SI Codes by Month tab and the CR cash return read the same before the write as on the board before
  the change, and after an approved write the money is under AT (USMC CV $612, USN $1,411, $2,023 in all); before it,
  A's $510 stays under no recognized code, as U41 has it.
  - **What users may see:** only with a file ORBIT did not write holding a list or an object as an SI code: the bulk
    write's question and its line afterwards count that requirement among those overwritten; with an object, the
    question, Go to it, the requirement's row and the Requirements matrix work where they threw.
  - **Test:** audit-recon "v2.00 (U56/U57) — a saved SI value that is not text counts as an answer a bulk write
    overwrites, and Go to it opens its field" (17 checks; Codex's block, after U41's; U58/U59 added two controls, now 19
    checks, 11 controls). The fixture: O&M, USAF / STOVL /
    USMC-C / USN; A, an LM prime, holding the value [101, 0, 203, 307]; B none by hand [0, 0, 409, 503]; C EN
    [0, 0, 0, 601]; every ask funded. For [], ["AT"] and [null]: the question [3, 1, 0, 2] and the line after the write (2
    overwritten), with two controls each (the file keeps the value exactly and A reads no code; after the write, saved and
    reopened, all three AT and every service's dollars as asked). For {"toString":null}: the question, and Go to it showing
    “{"toString":null}” kept as saved, with a control (the value and A's $611 after a save and reopen). Controls also: a
    valid AT beside a plain unrecognized "other" ([3, 1, 1, 1]), and "other" shown kept as saved. 8 checks fail on
    `254f29c` (U41 and U10 as committed) and on `96877da`, with the same values; the 9 controls pass on both. The U41
    block passes 42/42 before and after.
  - **Mutations:** `v200-u56-bulk-raw-string` (the bulk question back to String(): 7 checks fail) and
    `v200-u57-record-raw-string` (the field's choice back to String(): 1). U41's `v200-u41-field-shows-none` and
    `-bulk-blank` now find the changed lines and make the same change as before; the U41 block still catches each (3 and 2 checks),
    and so does the new block (2 and 8). The other 18 `v200-u41-*` mutants are still caught.
  - **Not covered:** the kept choice's value for a value that is not text is its label, which is cut at 60 characters
    (`inShow`), as U41 cuts the label; nothing reads it but `setSi`, which writes only the five. No check reads that value
    for a list (probe P1 saw "AT" and "" before the change, the label after). The question's own words in its confirm box
    are built from the same counts and are not read by the test. Row selection and the Requirements matrix with an object
    were seen in a probe, not a suite check. jsdom only; no browser was run.
    The money review (round 1) found three places outside these two that read such a value as text: after a list
    holding an object was repaired, the change journal could not be drawn; its "Was" cell read a saved list by its
    contents ("AT" for ["AT"], blank for []); and the PMO submittal review, in its panel and in its exported review
    workbook, showed "AT" for a saved ["AT"] and "" for [null] in "On the board now", and threw for an object. All three
    are fixed below (U58 and U59), with a fourth of the same kind that U58's reviews found: a saved object with its own
    "_b" key, which the journal took for its size mark.
- **U18 — a copy saved while a folder save is under way is never written over** (the lead's decision on 12 Oct, under
  Brad's "Don't wait for me. Let's keep pressing throughout to get this next version published.", about 5:30 PM ET). The
  folder save read the folder's copy once, at its start, and then wrote over whatever was there by the time it wrote. Bob
  took the pen and saved while Brad's 💾 Save was keeping the copy it had read in the folder's history; Brad's save then
  wrote his work over Bob's copy and thinned the history, so Bob's copy was in no copy in the folder, and Brad's board
  said "✅ Saved". The Live autosave, which is the same folder save run by the Live timer, did the same and said "✓ Saved
  to the shared folder automatically". U13 kept Brad's own record consistent but not Bob's copy. Now every folder save
  reads the folder's copy again after its history copy, just before it writes. Unless that copy is still, byte for byte,
  the one it read (or there is still none), nothing is written in its place. Bob's copy stays the folder's copy, Brad's
  work stays on screen, not saved, and the copy the save read stays in the folder's history. A copy that landed meanwhile
  is the clash, said with who saved it and when, with the same two choices. A copy gone or unreadable is said as such. If
  the board was moved to another year meanwhile, it is said with who saved it and when, and with no choice: the advice is
  to go back to the year the save was for and save there. The stopped save takes back its pen line and puts the board's
  stamp back (unless something was typed meanwhile, which keeps its own), whichever of these stopped it, so the header
  still says when it was last saved and by whom, not when the stopped save began. Both are put back on the working plan
  and, when a locked view was put on screen during the save, on the view's copy of it too, so the view's header and
  journal say the same while it is on screen. The working plan is kept in browser storage again as put back, so a board
  reopened from it shows no pen line the stopped save took back, and a later save does not carry one to the folder. This
  read is now the folder save's last wait, so U4's check of the mixed-import hold comes after it (U4's own words, above,
  now name it). If an import stopped part-way meanwhile and set the mixed-import hold, the hold is said instead, in U4's
  words: under the hold the clash's two choices are refused, and the import's line offers its two copies to save first;
  the quiet autosave leaves that line as it is. Their copy is the clash at the first save once saving is allowed again.
  - **What users may see:** in that race, instead of "✅ Saved": "⛔ Bob saved O&M FY27 to the shared folder just now,
    after the copy you are working from. Their copy landed while your save was under way, and your save stopped before
    writing over it. Load theirs (your work is kept aside, and one click puts it back) · Save yours over theirs (theirs is
    kept in the folder’s history)." (With nothing recorded of which copy the work came from, the opening is U30's: "…
    just now, and this browser has no record of which copy in the folder, if any, the work on screen came from.") The Live
    autosave says the same; the refresh that follows it in the same tick then puts its own line over it, as it already did
    when Bob's copy was there before the autosave read the folder: "⚠ Bob saved O&M to the shared folder just now, and you
    have unsaved changes. Nothing was replaced. Save yours, or reload to take theirs." If the folder's copy is gone or
    cannot be read just before the write: "⛔ Not saved. The shared folder’s copy of O&M FY27 is no longer there" (or "could
    not be read again just before it was to be written over — <the reason>"; "could not be read just before …" when the
    folder held no copy at the save's first read) ". Nothing was written in its place: a save never writes over a copy it
    has not read. Your work is still here — 💾 Save again to read the folder afresh." If the board was moved to another
    year meanwhile: "… changed while this save was under way — Bob saved it just now. Nothing was written in its place: a
    save never writes over a copy it has not read. Your FY27 work is still here — go back to FY27 and 💾 Save to read the
    folder afresh.", with no choices. A full import that stops part-way during this second read, or before it while
    another writer's copy lands, stops the save at the hold, with U4's words ("⛔ Writing to the shared folder is refused.
    A full import stopped part-way …", the two copies to save offered); the Live autosave leaves the import's own line as
    it is when browser storage takes the stopped save's own write (ledger U60). Every folder save now
    reads the folder's copy twice.
  - **Test:** audit-import "v2.00 (U18) — a copy saved while a folder save is under way is never written over"
    (112 checks): Bob takes the pen and saves while Brad's save is held at its last wait, with Brad's work unsaved and with
    nothing unsaved (U13's second-writer case, held before the write instead of in it): refused, Bob's copy the folder's
    copy, Brad's work and the board's stamp as they were, the clash said word for word with both choices; the retry, Save
    yours over theirs (refused while Bob holds the pen, with Bob's copy kept in the history) then Take the pen (Brad's work
    lands; v1 and Bob's copy both in the history); Load theirs; the folder's copy removed, unreadable, or saved by Bob while
    the board moved to FY28 (with Brad's and Bob's clocks moved on seven minutes, so the words name when Bob's copy was
    saved, not when the copy the save read was); a take-the-pen save over Bob's copy with nothing typed, stopped because
    the folder's copy is removed or cannot be read, takes its pen line back and puts the stamp back too; the folder's first
    copy landing at the save's read just before its write, and the same unreadable; a take-the-pen save stopped there
    takes its pen line back, also from browser storage and from the board reopened from it when a change was typed while
    it was held; a change typed while the save is held keeps the stamp it gave the board; the Live autosave held the same
    way, with what it says itself read before the refresh after it; a take-the-pen save over Bob's copy with nothing typed,
    whose stamp still names Bob, in the header's tooltip too; a locked view put on screen during the held save, with
    nothing unsaved, with a take-the-pen save, and with a take-the-pen save over Bob's copy (while the view is on screen,
    its header, tooltip, stamp, journal and what Brad is told, and that it still names Bob as the one who saved Bob's
    copy; once it is left, the working plan's); a copy rewritten during the save with the same stamp and other bytes; on
    this board with U4, a save held at this second read while a full import stops part-way there, refused at U4's hold
    (nothing written, not "Saved", the note unsaved, the stamp as it was); a full import stopping part-way while the save
    keeps its history copy, with Bob's copy landing there too, for 💾 Save and the Live autosave: nothing written over
    Bob's copy, the hold said with its two copies offered, the autosave leaving the import's line as it is (it passes on
    the board before the change, where U4's check refuses: a guard that U18 keeps U4's words); and four controls (no
    second writer: the save lands as before; Bob saves before Brad's save reads the folder: the existing clash, word for
    word; the same for the Live autosave; the same hold at the second read with no import: the save lands and says Saved).
    63 checks fail on the board before the change (eef8874, `3f4607b9`; the same 63 on 75d4d2f, `d6316db1`): every check
    not marked a control except the hold-and-landed-copy guard's four, which pass there, and the three controls that hold
    the save at its second read ((7a)'s, (7b)'s and the hold's), which that board cannot reach (it makes no second read);
    every other control passes there. Two of the guard's checks (the hold said, and the autosave's line left as it is)
    fail on this change without its hold line (75d4d2f with fix round 3's U18 lines, `722e0665`), and nothing else does;
    all four fail on 7ee498a (`fce8a391`, neither U4 nor U18), where the save writes over Bob's copy.
  - **Mutations:** `v200-u18-recheck-gone`, `-first-copy-unchecked`, `-gone-written-in-place`, `-unreadable-written`,
    `-said-nothing-written`, `-pen-line-kept`, `-stamp-moved`, `-other-year-choices`, `-autosave-unchecked`,
    `-stamp-name-moved`, `-stamp-on-view`, `-pen-line-on-view`, `-other-year-unnamed`, `-stamp-compare`,
    `-view-says-saved`, `-view-pen-line`, `-autosave-silent`, `-other-year-when-of-read`, `-read-again-first-copy`,
    `-other-year-advice`, `-storage-pen-line`, `-view-silent`, `-view-stamp-name`, `-stamp-over-typed`,
    `-hold-before-reread`, `-late-for-every-clash`, `-hold-unsaid`, `-pen-line-only-on-clash` and
    `-stamp-only-on-clash`. Each is caught by the focused block. Full-suite sensitivity runs in the final-tree queue.
  - **Not covered:** a copy that lands while the write itself is being made (between its start and its close) is still
    written over: a file share has no atomic compare-and-write. U13's second-writer case holds Brad's save exactly there,
    and still sees Bob's copy written over. The window is now the write alone, no longer the history keeping before it. A
    save waiting for another tab's Web Lock (U20) is not changed by this. Under a locked view put on screen during the
    save, browser storage is not written again (persist() refuses there): a change typed before the view was put on screen
    keeps the stopped save's pen line in browser storage, and in a board reopened from it, until the next change after the
    view is left (run: the round-4 money review's probe Q4). Under a locked view the clash's two buttons refuse until the
    view is left, as for any clash said there; in a locked view of a cycle that does not hold the save's year, the view is
    on another year, so the stop is said in the other-year words ("go back to FY27 and 💾 Save") while the view is on
    screen -- true, but leaving the view comes first (read in code, not run). Under the mixed-import hold, a copy that
    landed is not named until saving is allowed again, when the first save reads it and says the clash. A copy rewritten
    outside the board with its old stamp is refused like a landed copy and named as it names itself ("Brad saved … after
    the copy you are working from"). With the journal at its 600-line limit, the pen line's arrival dropped the oldest
    line, and taking the pen line back does not restore it (it is in the copy the work came from unless 600 lines or more
    were added since; read in code, not run). Three refusals outside this change keep the same shapes as before: the
    history-failure refusal (v1.97, item 79) still leaves the stamp moved; a write that throws leaves its stamp moved and,
    under a locked view, takes its pen line out of neither copy -- the view holds a copy of the line, not the line itself,
    so the view and the working plan both keep it (run: the round-3 money review's probe P2); and U4's own hold check,
    just after this read, takes a take-the-pen save's pen line back in memory only (browser storage keeps it when a change
    was typed during the save) and, under a locked view, acts on the view's copy (read in code, not run): their own
    findings.
    Under the mixed-import hold, the stopped save writes browser storage before the hold stops it, which the board did
    not do before (U4): while storage still refuses, its warning takes the place of the import's line and its two
    rescue choices in the quiet autosave; once storage takes it again, the work on screen is written over the plan the
    import left in browser storage while the import's line still names that plan. No copy is lost: the landed copy
    keeps its bytes, the copy the save read stays in the history and the imported file stays offered (the round-5 money
    review; ledger U60). And three of the refusal's every-stop lines are checked only when another copy landed:
    browser storage kept again ((8b)), a locked view's copy put back ((11a)-(11c)) and the hold said ((14)); three wrong
    forms that keep one of them to the clash alone pass the block (the round-5 tests review).
- **U58 and U59 — the change journal and the PMO submittal review show a saved SI value that is not text as saved, by its
  JSON** (the money review of U56/U57, round 1, 18 Oct, should-fixes S1–S3, with the tests review's should-fix; ledger U58
  and U59; this track's own reviews, round 1, found one more value of the same kind and asked for words and checks, all
  taken. Not a release blocker: it joins v2.00 only if both reviews are clean by 8 PM ET on 18 Oct, Brad's cut). U56/U57
  stopped two of the places that read an SI code U41 keeps as saved from putting it through String(). Two more did the
  same. The change journal's Was and Became cells joined a list's items into text: after AT was chosen for a requirement
  holding ["AT"], its line read "Was AT, Became AT", beside the bulk write's line saying 2 were overwritten; [] and [null]
  read as nothing, a saved 7 as the money "$7" and true as "yes". A list holding an object without a usable toString,
  [{"toString":null}] (valid JSON), could not be drawn at all: once Go to it or the bulk write had repaired it (U56/U57
  made that possible), opening the journal threw "Cannot convert object to primitive value", every redraw while it was
  open threw, so the panels drawn after it were not redrawn, and its ↶ Put back was out of reach until the entry left the
  newest 300. A saved object with its own "_b" key, such as {"_b":{"toString":null}}, did the same, because the journal
  took it for its own size mark (the mark it writes for a value too long to keep) and turned its "_b" into text; and
  {"_b":5} read "5 characters". Nothing was lost; the entries stayed in the file. And the PMO submittal review printed
  "On the board now" through String(), in its panel and in its exported review workbook: "AT" for a saved ["AT"], where
  the board holds no recognized code, "" for [null], 7 for 7 and "[object Object]" for an object; a saved
  {"toString":null} made the whole review panel and the review workbook throw, so no change in any held submittal could
  be reviewed or exported while that row existed. Now the journal shows such a value as Needs attention lists it
  (“["AT"]”, “[]”, “7”, “true”, “[{"toString":null}]”, “{"_b":{"toString":null}}”, “{"_b":5}”), before its size mark,
  which it takes for any object whose "_b" is a number over 300, the only mark it writes. The review prints such a value by its whole
  JSON in the same quotes (“["AT"]”, “[null]”, “7”, “{"toString":null}”): the review workbook prints it whole, as it
  prints text, and the review panel shows its first 300 characters, as it does for every field (a cut at Needs
  attention's 60 characters would split an emoji into a replacement mark in the workbook). Text, a recognized code or any
  other, reads exactly as before. No dollar moves: neither place feeds a figure. Before and after a bulk write, the
  workbook, the CR cash return and the funds-flow export are the same cell for cell as on the board before the change, and
  the review workbook differs only in that cell (probe P2, scaled fixture: AT holds USMC CV $612,000 and USN $1,411,000
  after the write, $2,023,000 in all).
  - **What users may see:** only with a file ORBIT did not write holding a list, an object, a number or true/false as an SI
    code. The change journal's Was and Became cells show it in quotes as Needs attention lists it (a saved 7 no longer reads
    as $7, true no longer as yes); with a list holding {"toString":null}, or an object of its own with a "_b" key, the
    journal opens after the repair, and for the list its ↶ Put back brings the list back. The submittal review and its
    workbook show it in quotes; with {"toString":null} they open and export where they threw.
  - **Test:** audit-recon "v2.00 (U58/U59) — the change journal and the PMO submittal review show a saved SI value that is
    not text as saved, by its JSON" (29 checks, 7 controls), after U56/U57's block, on its fixture (A, an LM prime, holding
    the value [101, 0, 203, 307]; B none by hand [0, 0, 409, 503]; C EN [0, 0, 0, 601]), the journal and the review read
    as drawn and the review workbook from its bytes. The journal: ["AT"] with AT chosen in A's field (Was “["AT"]”,
    Became AT, and the file's own line Became “["AT"]”), ↶ Put back on it (CONTROL: ["AT"] back exactly; its own line
    Was AT, Became “["AT"]”); [] after the bulk write (Was “[]”; CONTROL: C's Was EN); a saved 7 (Was “7”, never $7), true
    (“true”, never yes), {"toString":null} in the same quotes, and a list holding markup (read as text); [{"toString":null}]
    with AT chosen in the field (the journal opens and reads it, a redraw with it open works, its ↶ Put back brings the list
    back exactly, and the bulk write after that reads it the same way); {"_b":{"toString":null}} (the journal opens and
    reads it, and a redraw works) and {"_b":5} (“{"_b":5}”, never 5 characters); CONTROL: a list whose JSON is 324
    characters reads as the journal's size mark, "324 characters", with no Put back, as for every field. The review, a
    held submittal from AV proposing EN for A: “["AT"]”, “[null]” and “{"toString":null}” in "On the board now", in the
    panel and in the workbook, “7” in the panel, a list longer than 60 characters with an emoji where the label cuts
    printed whole in the workbook, and one of 129 characters printed whole in the panel and the workbook. Controls also: a
    plain 'other' in the review and the journal and a recognized 'LA' in the review (LA — Airframe), as before; and the
    review applies nothing (the value and every service's dollars as before). Every expected value is typed. On `eef8874`
    the 22 non-control checks fail (Was AT, blank, $7, yes, the object without quotes, the markup list's contents and
    "5 characters"; the journal throws for the list holding {"toString":null} and for {"_b":{"toString":null}} and offers
    no Put back; the review reads AT, blank, 7 and the long lists' contents, and throws for the object) and the 7 controls
    pass; on the commit all 29 pass. On this track's
    round 1 (the rule after the size mark) the two "_b" checks fail, and on its tests reviewer's prototype (any number
    taken for the size mark) the {"_b":5} check fails. Two controls added to U56/U57's block (now 19 checks, 11 controls),
    from the tests review and the money review (m4): a saved bare null is an answer the write overwrites ([3, 1, 0, 2]),
    and the kept choice chosen again writes nothing over [] or ["AT"]; both pass on `eef8874` and on the commit, and the
    second fails on `254f29c` (its value was "" and "AT" there, which setSi wrote over the list). The U41 block 42/42 and
    the U56/U57 block's 17 checks as committed pass before and after.
  - **Mutations:** the journal: `v200-u58-journal-joins-list` (its rule taken out: 13 checks fail), `-journal-became-unread`
    (only the Was cell read as saved: 13), `-journal-own-b-as-size` (the rule after the size mark again: 2, the two "_b"
    checks), `-journal-size-as-value` (the journal's own size mark read as a value, “{"_b":324}”: 1, the control),
    `-journal-any-number-mark` (any number taken for the size mark: 1, {"_b":5}), `-journal-unescaped` (drawn without
    esc(), markup drawn as markup: 1) and `-journal-lists-numbers-only` (the rule for lists and numbers only: 4); the review:
    `v200-u59-review-raw-string` (back to String(): 9), `-review-cut-label` (through Needs attention's 60-character label:
    2, the long lists), `-review-objects-only` (JSON for objects only, 7 reads 7: 1) and `-review-cut-120` (cut at 120
    characters: 1); for U56/U57's block, the tests review's two plausible wrong getters `v200-u56-getter-loose-null`
    (r!=null) and `-getter-falsy-blank` (a falsy value that is not text read as no answer), 1 check each (the null
    control), and `v200-u57-option-value-blank` (the kept choice's value "" for a value that is not text: 1, the kept
    choice chosen again). Each is caught by the focused harness of the U41, U56/U57 and U58/U59 blocks (90 checks), and
    none of them fails a U41 check. The 20 `v200-u41-*` mutants, `v200-u56-bulk-raw-string` and
    `v200-u57-record-raw-string` are still caught, and so is `v200-jrnlshow-raw` (audit-inject), whose size-mark line is
    unchanged.
  - **Not covered:** the review reads the board's value through `pmoVal`, which takes an empty value for none in every
    field, so a saved [], {}, false or bare null reads "—" in "On the board now", not as Needs attention lists it (not
    changed: it decides what the review compares and proposes). The review panel cuts every field at 300 characters with no
    mark; the quotes and brackets make such a value a few characters longer than String() did, so a value that showed
    whole may now be cut, and a cut through an emoji leaves half of it. In the review workbook a value whose JSON is longer
    than 32,767 characters is one cell longer than Excel holds, and a U+FFFE or U+FFFF inside an object's JSON is written
    into the file as it is, as for text before (not opened in Excel). In the review the text '“["AT"]”' and the list
    ["AT"] read the same (Needs attention tells them apart). The journal records a value that was absent and a saved bare
    null alike, so a saved null reads "not set", and Put back of a write over it (the bulk write, a field choice or a PMO
    apply) deletes the key and the requirement reads its derived code again, its money with it (the money review's m3;
    not changed, still open). A value whose JSON is longer than 300 characters is recorded as its size and cannot be put
    back, and a saved object whose own "_b" key is set cannot be put back either (the journal refuses it as it refuses its
    own size mark), as for every field; such an object whose "_b" is a number over 300 still reads as a size mark. In the journal a value
    whose JSON is longer than 60 characters is cut there, as Needs attention cuts it (`inShow`), and a cut through an
    emoji leaves half of it on screen, as Needs attention's own label does (U41); a line for the whole SI map of a year
    keeps its old words (no check reads it). The journal still calls the field "sustainment indicator" (the money
    review's m5), and its other fields still join a list's items: a requirement's first WBS line reads "[object Object]"
    in Became, and a note a file carried as a list holding {"toString":null}, once typed over, leaves the journal unable
    to be drawn (probe P4; not SI, not changed). jsdom only; no browser was run.
- **U32, U33 and U50 — an RCN / EEIC list that repeats a key, or holds "__none__" or a key that is not text, never counts
  money twice; a file handed over with one is refused in true words, and the user's own board comes across saying what it
  holds** (Codex's review of `main`, as Brad supplied it, 12 Oct, about 6:05 PM ET: "Duplicate K1 registry entries." and
  "One registry entry named __none__." "Both accept an imported cycle and export USAF $1,800 / ANG $400 from independently
  expected $900 / $200."; Codex batch B2, 13 Oct, P2, on the words of the full import). The RCN-EEIC by Month sheet printed
  a row for every entry of an RCN / EEIC list and found each row's money by the entry's key, as text. A list that named K1
  twice -- a locked cycle's, which a cycle in an imported file brought with it, or the working plan's -- printed K1's row
  twice and put its money twice into each service total, the grand total and the NOT FUNDED Ask: on the synthetic fixture
  USAF $1,800 and ANG $400, where the money is $900 and $200. An entry keyed "__none__", the name the sheet used for money on
  no combination, printed that money under its own codes and again as not assigned. The number 1 beside the text "1" was one
  name printed twice as well; a requirement on "1" with only the number 1 listed was printed under the number's codes, which
  the screen does not show it on; and an entry keyed "constructor" made the workbook's export fail. Now the sheet names each
  combination by where the board finds it -- the first entry whose key is the requirement's (or the CLIN's) pointer exactly,
  as the screen and the Spend Plan Source find it -- and counts each once; the not-assigned row is a name no entry can take,
  and a requirement on no combination is never filed under an entry keyed "". The door every file handed over passes (⬅
  Import one appropriation, ⇊ several boards, packages, submittals, band ladders) refuses an RCN / EEIC list that repeats a
  key, holds a key beginning with two underscores, a key that is not text, an entry with no key, or an entry that is not one;
  it says which list, what it holds and why, in words (a key such as "constructor" included), and takes nothing. It says
  who saved the file as the file says it -- a board file this version saved came from a board that held such a list, never
  "an ORBIT before this one"; one an earlier version saved, that that ORBIT took such a list without a word; a file that
  names no version (a package, a state file), neither -- and a way that works for that kind of file: a working plan's list
  is put right on a board of this version (✕ on a row marked ⚠ repeats removes that row alone) and the file written again
  (saved, exported, issued or published); a locked cycle's list stays as it was locked, so ⬅ Import
  one appropriation and ⇊ Import several boards refuse every file that carries that cycle, and the file itself opens as a
  board; a file whose working plan's list is refused and which carries such a cycle as well -- a board that locked PB27 while
  its list repeated K1 holds both -- is told so, and only the ways that work for it, as ✕ on the working plan's row would
  leave it refused, for the cycle's list; a board .html refused for an entry in its working plan's list that is not null
  ("K9", 0, []) is told that it opens as a board and that ⬅ Import a full board takes it; a package, a state file or a PMO
  copy refused for such an entry that ✕ removes ("K9", 5, []) is told that ✕ on its row in 🗂 RCN / EEIC takes it out, and
  the file written again, and for null, 0, false or "", which ✕ does not remove, no way is named -- a null entry is told no
  way whether its file comes alone or among several through ⇊ Import several boards; and, for a board .html only (a PMO
  copy is not told it: its locked cycles are only the reference it was cut to, which would replace the board's own), ⬅
  Import a full board takes a whole board of one's own, replacing this board's whole BAE list and execution data, so it is
  not the way to take one appropriation. ⬇ Export one appropriation, when the door refuses the file it has just written, no
  longer says to take it back with ⬅ Import one appropriation: it says that Import one appropriation and Import several
  boards refuse it, why, and what works for it. The help for ⬅ Import one appropriation says which files it refuses,
  whichever board saved them, and what takes them. ⬅ Import a full board -- the user's own board, Brad's way onto a new version --
  takes those lists as the file holds them and says what each holds in the question asked before anything is replaced and
  again once the board has reopened, in words true for each requirement: a requirement on a key that is text (not empty)
  reads the first entry with that key, and, when a locked cycle's list holds an entry whose key is not text, that entry is
  kept but not read, as since v1.99, so a requirement on it shows no code there and its money is on no combination (round 3
  said "Each requirement reads the first entry with its key", untrue of R1 on the number 1 in such a cycle and of a
  requirement on 0 in any list -- Codex B2, P2). The lists themselves are kept byte for byte, and read as before. It refuses
  only a null entry in the working plan's list, which every reader of that list stops at (anything else there that is not
  an entry, such as "K9", 0, [] or 5, is read past as before; a locked cycle's list is read without such entries, as since
  v1.99). A full import that stops early -- not a board, or answered no -- leaves the next file handed over held to the
  whole rule. The shared folder's copy and the sidecar beside the board are read as before, a null entry included: refusing
  them froze the team's folder, every later Save refused. On the 🗂 RCN / EEIC panel a row that repeats an earlier row's key
  says so, and ✕ on it removes that row alone, changing no assignment, and is saved. Add RCN / EEIC no longer gives a new
  entry a key still in use. 🔒 Lock, which keeps the working plan's list as it is, now says first, in its own question, when
  that list breaks the rule -- what it holds, as the door says it, and that ⬅ Import one appropriation and ⇊ Import several
  boards will then refuse every file that carries the cycle, as a locked cycle's list stays as it was locked; Cancel locks
  nothing, and the lock itself is made as before (verification round 7: a board that took its file whole, its working plan
  listing K1 twice, locked a cycle without a word, and every file it wrote after was refused for that cycle, though ✕ had put
  the working plan right).
  - **What users may see:** a board that holds such a list exports each combination once -- its RCN-EEIC totals and NOT
    FUNDED Ask fall by what was doubled, money on no combination reads as not assigned, and every requirement is printed
    under the codes the screen shows it on. A file handed over with such a list is refused: "⚠ Nothing imported —
    “cycle.html” was refused: the RCN / EEIC list at the saved state.cycDb.byAp.om.cycles.PB|2027.rcn holds the key “K1”
    twice (rcn[0] and rcn[1]); a key names one combination.", with an alert that, for a board file this version saved,
    ends "An RCN / EEIC list names each combination once, by a text key of its own. This file says ORBIT v2.00 saved it,
    from a board that held such a list. A locked cycle’s list stays as it was locked, so ⬅ Import
    one appropriation and ⇊ Import several boards refuse every file that carries that cycle. The file itself opens as a
    board. A whole board of your own comes across with its lists as they are by 📁 File → ⬅ Import a full board, which says
    first what they hold. That replaces this board’s whole BAE list and execution data with the file’s, when it carries
    them, so it is not the way to take one appropriation. Nothing on this board was changed." For a working plan's list the
    third and fourth sentences read instead "A list that is not a locked cycle’s can be put right on a board of this
    version, in 🗂 RCN / EEIC, where ✕ on a row marked ⚠ repeats removes that row alone, and the file written again." (and a
    board .html's last two follow, but not for a PMO copy); when that file carries a locked cycle whose list breaks the rule
    as well, the alert reads after the second sentence "This file also carries a locked cycle whose RCN / EEIC list a file
    handed over is refused for. A locked cycle’s list stays as it was locked, …" as above; for "K9" or 0 in a working
    plan's list a board .html's alert ends "No ORBIT makes such an entry. This file says ORBIT v2.00 saved it, from a board
    that held one. The file itself opens as a board. A whole board of your own comes across …"; a package or a PMO copy
    refused for "K9" there ends "… No ORBIT makes such an entry. It can be taken out on a board of this version, in 🗂 RCN /
    EEIC, where ✕ on its row removes it, and the file written again." (a PMO copy saying who saved it first), and one
    refused for 0 or null names no way; a file
    an earlier version saved reads "An ORBIT before this one took such a list without a word and could save it with its
    board." in place of the second; a package or a state file is told neither of who saved it nor of a board .html's ways. A
    full import's question, and the reopened board, add "RCN / EEIC lists as the file holds them, which a file handed over is
    refused for: O&M PB27’s list holds the key “K1” twice (rcn[0] and rcn[1]). A requirement on a key that is text (not
    empty) reads the first entry with that key, as the ORBIT that saved the file did. The RCN-EEIC sheet counts each key once
    and money on no combination only as not assigned" (or "… O&M working plan’s list holds rcn[0], which is not a combination
    (“"K9"”) …"); when a locked cycle's list holds a key that is not text, "… as the ORBIT that saved the file did. A locked
    cycle’s entry whose key is not text is kept but not read, as in every ORBIT since v1.99: a requirement on it shows no
    code there, and its money is on no combination. The RCN-EEIC sheet …". The panel's "Used by" on a repeated row reads "⚠
    repeats row 1". ⬇ Export one appropriation of a board holding such a locked cycle ends its status line "… with the
    destination list, cost estimates and reprogramming log. It is not taken back by ⬅ Import one appropriation or ⇊ Import
    several boards, which refuse it: the RCN / EEIC list at the saved state.cycDb.byAp.om.cycles.PB|2027.rcn holds the key
    “K1” twice (rcn[0] and rcn[1]); a key names one combination. An RCN / EEIC list names each combination once, …" (the
    refusal's own words), where it said "Take it back with 📁 File → ⬅ Import one appropriation."; every other export says
    that as before. The help for ⬅ Import one appropriation adds "A file that carries a locked cycle whose RCN / EEIC list
    breaks the rule for one — a key repeated, missing, not text or beginning with two underscores, or something in it that
    is not an entry — is refused, whichever board saved it: a locked cycle’s list stays as it was locked. Such a file opens
    as a board, and 📁 File ▾ › Boards and appropriations › ⬅ Import a full board (new version)… takes it whole." 🔒 Lock,
    while the working plan's list holds K1 twice, asks, before "The working board is not changed.", "The RCN / EEIC list it
    keeps holds the key “K1” twice (rcn[0] and rcn[1]); a key names one combination. A locked cycle’s list stays as it was
    locked, so ⬅ Import one appropriation and ⇊ Import several boards will refuse every file that carries this cycle, on every
    board of this version."
  - **Test:** audit-recon "v2.00 (U32, U33) — an RCN / EEIC list that repeats a key, or holds “__none__” or a key that is not
    text, never counts money twice: a file handed over with one is refused, and the user’s own board comes across saying
    what it holds" (288 checks). Codex's two shapes in PB27's own list, R1 on K1 and on none, and on the entry named
    "__none__"; PB27 [K1, K1, "__none__"]; PB27 [null, K1]; PB27 [the number 1] with R1 on the number 1; the working plan's
    list [K1, K1], on one code and on two; [1, "1"] with R1 on "1" and on the number 1, in the working plan and as read by
    PB27 locked before v1.99; [1] with R1 on the number 1 and on "1"; ["K9", K1], [0, K1] and [[], K1]; [K1, an entry keyed
    ""] with R1 on none; a hand-made file with an entry keyed "constructor"; R1 unfunded on [K1, K1]; and a control on
    ordinary distinct keys beside each. Each through the door, ⬅ Import one appropriation, ⇊ Import several boards, ⬅ Import
    a full board into the user's own board with the same browser reopened and then saved and reopened, and the file opened
    directly and then saved and reopened, as each case needs. The RCN-EEIC sheet is read from the workbook's bytes against
    literals worked by hand: USAF 900 and ANG 200 in the award month and in TOTAL, all services 1,100, every service total in
    the breakout, each under the codes the board shows R1 on, and the NOT FUNDED Ask USAF 900 / ANG 200. Every refusal and
    every statement is checked word for word, browser storage byte-identical where nothing is taken. The full import's words
    are written out whole for Codex B2's case -- PB27 [{k: 1, 99999 / ZZZZZ}] with R1 on the number 1 -- and beside it K1
    with R1 on K1, and the working plan's [{k: 0}, K1] with R1 on 0: the question, the reopened report, the locked list as the
    file holds it (written, reopened, saved and reopened), R1's pointer, the keys PB27 reads and the code R1 shows, and the
    sheet from the bytes. The user's own board holding PB27 [K1, K1], taken whole: its saved file (⬅ Import one
    appropriation) and its one-appropriation file (⇊ Import several boards), on that same board, refused in words true for a
    file this version saved, storage unchanged; that one-appropriation file between two board files that say v1.99 saved them,
    through ⇊ Import several boards on that board, the batch refused whole and the words telling who saved the file they name;
    that one-appropriation file opened (USAF 900 / ANG 200 / 1,100 from the bytes); its package taken by a new board; its
    saved file taken back by ⬅ Import a full board. A file naming v1.99, and a
    state file (.json) naming no version, each told only what is true of it. The user's own board whose working plan's list
    and PB27's each list K1 twice, taken whole: both lists' sheets from the bytes (USAF 900 / ANG 200 / 1,100); ⬇ Export one
    appropriation's status line; its saved file (⬅ Import one appropriation) and its one-appropriation file (⇊ Import several
    boards) on that board, refused naming the locked cycle and only the ways that work; its package and its PMO copy on a new
    board, each refused for the working plan's list with only the way that works for it; ✕ on the working plan's row 2, after
    which its saved file is refused still, for PB27, and its package is taken. ⬇ Export one appropriation's status line on
    the board holding PB27 [K1, K1]. A file whose working plan's list repeats K1 beside PB27's ordinary [K1], and one whose
    working plan and PB27 each repeat K1, through ⬅ Import one appropriation and ⇊ Import several boards; "K9" and 0 in the
    working plan through ⬅ Import one appropriation; PB27 [K1, K1, the number 1] through the full import (the question names
    both, and says a locked cycle's entry whose key is not text is kept but not read); the working plan's [K1, K1 on two
    codes], ["K9", K1], [0, K1] and [[], K1] kept as the file holds them through ⬅ Import a full board -- written, reopened,
    saved and reopened; the help for ⬅ Import one appropriation, word for word. The sixth round: the user's own board whose
    working plan lists K1 twice, no locked cycle amiss, taken whole -- ⬇ Export one appropriation's status line names no way
    back that refuses its file, which ⬅ Import one appropriation then refuses on that board; after ✕ on row 2 the line says
    to take the file back, and a new board takes it -- and an ordinary board's line (control); a file whose working plan
    holds "K9" beside PB27 [K1, K1], and one whose working plan repeats K1 beside PB27 [null, K1], through the door and ⬅
    Import one appropriation, each told of the locked cycle too; the user's own board whose working plan holds "K9", then K1,
    or 0, then K1, taken whole -- its package and its PMO copy refused on a new board, for "K9" told ✕ and the file written
    again (after ✕ the door passes both and a new board takes the package), for 0 told no way (after ✕, which does nothing,
    the package is refused still). The seventh round: the user's own board whose working plan lists K1 twice, taken whole --
    🔒 Lock POM27 answered Cancel (the question word for word; nothing locked, storage unchanged), then answered yes (POM27 keeps
    [K1, K1]; its sheet from the bytes USAF 900 / ANG 200 / 1,100; the saved file refused on a new board by ⬅ Import one
    appropriation and on that board by ⇊ Import several boards; after ✕ on row 2 refused still, for POM27); ✕ on row 2 first,
    then the lock (asked what it always was; POM27 [K1]; 900 / 200 / 1,100; a new board takes the saved file); "K9" in the
    working plan, the question naming it as the door does; an ordinary [K1, K2] (control). The ✕ way for every kind of entry it
    is said or not said for: PB27 ["K9", K1] through ⬅ Import one appropriation and ⇊ Import several boards (the locked
    cycle's words, never ✕); the working plan's false, "", 5 and [], then K1, taken whole -- the package and the PMO copy
    refused on a new board, ✕ named for 5 and [] only, and ✕ clicked on row 1 in the open 🗂 RCN / EEIC panel (for 5 and []
    the row goes and a new board takes the package; for false and "" the row stays and the package is refused still); a null
    entry among three files through ⇊ Import several boards (no way named). The eighth round: the user's own board holding
    PB27 [K1, K1], taken whole -- 🔓 Unlock PB27 (its question word for word; the saved file carries PB27 unlocked, [K1, K1]),
    and that saved file refused by ⬅ Import one appropriation on a new board in the words now said, storage unchanged; then 🗑
    Delete PB27 (asked; gone), and on a second such board 🔒 Lock PB27 over it (the whole question, "This replaces the existing
    PB27 cycle."; PB27 locked with the working plan's [K1]; USAF 900 / ANG 200 / 1,100 from the bytes) -- and the saved file
    written again taken by a new board (controls); a lock while the working plan's list holds the number 1 as a key, or
    "__none__", then K1: answered Cancel (the whole question, naming the entry as the door does; nothing locked, storage
    unchanged), then yes (POM27 keeps the list as it is; its saved file refused on a new board, as the question said). Also: a null entry in the working plan's list (refused at the door, by the full import,
    and by ⇊ Import several boards beside the user's own board file, whose reason then ends "(so none of the 2 files was
    taken)" and whose words still name no way -- and, beside PB27 [K1, K1], alone and among two, naming that cycle too); the door on a key repeated apart, three times, beginning with two
    underscores, missing and not text, on keys every object answers to (refused in words) and on "constructor" twice; a full
    import that stops early, then a file handed over; the shared folder's copy and the sidecar read with [K1, K1] and with
    [null, K1]; ✕ on the second and on the first of two rows with one key, and the second reopened; Add RCN / EEIC in one
    millisecond after removals. 177 checks fail on the board before the change (USAF 1,800, ANG 400, all services 2,200; NOT
    FUNDED Ask 1,800 / 400; the door passing every list; the full import silent; the "constructor" export failing; ✕
    clearing R1's assignment; a file this version saved taken; Export one appropriation saying to take its file back by
    Import one appropriation; the help silent; a package or a PMO copy holding "K9", 0, false, "", 5 or [] taken; a lock
    asking nothing of the list it keeps). The 111 that pass there are the 32 fixtures, the 49 controls and 30 guard
    checks -- the guards' money, their lists as kept and what they read, which that board did right; the guards' door,
    full-import and statement checks fail there. On round 7's board 27 fail, and only these: every check whose expected
    refusal or status line carries the locked cycle's sentence, which round 7 said with "and no board changes it" (23 of
    its 277 checks), and the eighth round's 4 new ones that do (the two unlocked-cycle refusals and the tests reviewer's two saved-file refusals); the eighth round's two lock questions pass there, as
    round 7's question was already right. With round 7's block, round 6's board failed 2, round 5's 11, round 4's 30, round 3's
    92 and round 2's 98, so every U50 statement check fails on round 2's and round 3's words; this round changes no U50 check
    and did not run those boards.
  - **Mutations:** `v200-cycreg-keys-repeat`, `-keys-cycle-only`, `-notfunded-repeat`, `-key-as-name`, `-at-by-name`,
    `-at-text-only`, `-req-by-name`, `-clin-by-name`, `-door-open`, `-door-repeat`, `-door-adjacent`,
    `-door-underscores`, `-door-sentinel-only`, `-door-not-text`, `-several-own-board`, `-own-takes-entry`,
    `-own-cycle-entry-refused`, `-own-board-refused`, `-own-board-unsaid`, `-say-first-only`, `-say-entry-garbled`,
    `-folder-refused`, `-sidecar-refused`, `-refusal-untrue`, `-advice-unwarned`, `-repeat-row-clears`,
    `-first-row-alone`, `-repeat-row-unsaid`, `-add-key-reused`, `-add-steps-once`, `-own-entry-any`, `-at-empty-matches`,
    `-folder-as-own`, `-sidecar-as-own`, `-mode-sticks`, `-odd-plain-object`, `-del-unsaved`, `-say-cycle-unsaid`,
    `-advice-any-board`, `-say-every-reads`, `-say-kept-unsaid`, `-say-cycle-parenthesis`, `-cycle-list-trimmed`,
    `-cycle-reads-numbers`, `-own-falsy-refused`, `-own-array-refused`, `-tail-old-for-now`, `-tail-plan-for-cycle`,
    `-tail-full-for-any`, `-tail-unstamped-old`, `-tail-text-unkept`, `-several-txt-dropped`, `-tail-cycle-too-unsaid`,
    `-tail-cy-any-cycle`, `-tail-entry-ways-unsaid`, `-tail-null-ways`, `-tail-pmo-full`, `-tail-written-saved`,
    `-export-says-back`, `-export-why-only`, `-help-refusal-unsaid`, `-say-cynt-first-only`, `-plan-deduped`,
    `-plan-junk-trimmed`, `-tail-null-several`, `-entry-x-unsaid`, `-entry-x-pmo-unsaid`, `-entry-x-falsy`, `-export-cycle-only`, `-export-always-not-back`, `-cyodd-lists-only`, `-too-list-only`, `-lock-unsaid`, `-lock-entry-what`, `-entry-x-cycle`, `-entry-x-falsy-some`,
    `-entry-x-text-only`, `-tail-null-two-only`, `-cycle-unchangeable`, `-lock-nt-unsaid` and `-lock-reserved-unsaid` (81);
    each is caught by this
    block, except `-clin-by-name`, which audit-recon's own v1.98 item 83 and v1.99 item 88 checks catch. A repeated key read
    at its LAST entry is not an entry: the row's label comes from rcnLabel, which finds the first entry with that key, so the
    sheet is the same either way.
  - **Not covered:** A LOCKED CYCLE WHOSE LIST BREAKS THE RULE (Brad, 13 Oct, about 8:30 PM ET: a locked cycle's list stays
    as it was locked; a way to correct one is deferred). While a board holds one -- taken whole by ⬅ Import a full board,
    opened from an earlier ORBIT's file, or locked on this version while its working plan's list broke the rule (the lock
    now says so first, and Cancel locks nothing) -- what it CAN send: its saved board file, which opens as a board and comes back whole
    by ⬅ Import a full board (that board's own, or a new one); its one-appropriation file, which opens as a board for the
    appropriation lead; its package (it carries the working plan's list and no locked cycle) and its PMO copy (whose locked
    cycles are only the reference it was cut to, with no list), which pass every door while the working plan's list keeps
    the rule -- when that list repeats a key as well, each is refused for it, naming it and the way that works (✕ on the
    repeated row, then issued or published again; probed), and when it holds null, 0, false or "", which ✕ does not
    remove (as before), each stays refused, and its state file (.json) too; and the office's submittal from that copy, which File → Import holds for review and which
    carries no RCN / EEIC list. Every export of that board keeps the
    money: its RCN-EEIC sheet, PB27's and the working plan's, prints USAF $900 / ANG $200 / $1,100 once (probed with K1
    twice, and with "__none__", R1 on none and on it). What it CANNOT send: its saved file and its one-appropriation file
    through ⬅ Import one appropriation or ⇊ Import several boards, on any board of this version, that board's own included --
    so an appropriation lead's work on such a file cannot be taken back one appropriation at a time, and ⬅ Import a full
    board, which takes it, replaces the taking board's whole BAE list and execution data with the file's, as the refusal and
    the full import's question say. The one way out is to give that cycle up: 🔓 Unlock it, then 🗑 Delete it or 🔒 Lock over
    it (which replaces its frozen plan with the working plan's, as that question says); every file the board writes after that
    is taken by ⬅ Import one appropriation and ⇊ Import several boards, whose door no longer meets the cycle's list (while the
    working plan's list keeps the rule; the block drives ⬅ Import one appropriation on a new board), and the cycle as it was
    locked is gone (verification round 8, money SF1). A board whose working plan's list already holds a null entry (taken before this change,
    or a file opened directly, which no door checks) still cannot export its workbook or show its RCN / EEIC panel, as
    before, and the refusal of such a file names no way to put it right, as none works, whether it comes alone or among
    several files through ⇊ Import several boards. ⬇ Export one appropriation says, in the refusal's own
    words, when the door refuses the file it has just written; 💾 Save, issuing a package and publishing a PMO copy do not
    say it of their files, and the help names only Import one appropriation's refusal. ✕ on an entry that is 0, false or ""
    does nothing and says nothing (as before); such a board .html still opens as a board and comes across by ⬅ Import a full board, which keeps the entry, and
    the readers read past it. Outside this change and the same on d66dd60: ⬅ Import a full board of a PMO copy, into a
    board holding a locked cycle, puts the copy's reference of that cycle (no years, no list) in place of the board's own
    (verification round 5, m3 -- the refusal of a PMO copy no longer names that way; for its own ledger row); the full
    import's question names the version as "v2.0" for v2.00 (minor not padded; m2); the ALIGNMENT BREAKOUT BY FUNDING LINE
    sheet groups a requirement's services by pointer as a plain object key, so a working plan's list holding the number 1
    and the text "1" on two codes, with USAF on 1 and ANG on "1", puts ANG under the number's codes there while the RCN-EEIC
    sheet prints it under "1"'s (verification round 6, money m3; reachable only from a file; for its own ledger row). The
    working plan's advice names "a row marked ⚠ repeats" also where no row is marked -- a list refused for "__none__", a key
    that is not text or an entry with no key, whose row ✕ removes by the ordinary removal, clearing what points at it, as
    its question says (money m1); the help for ⬅ Import one appropriation names only the locked cycle's refusal (m2); "This
    file says ORBIT v2.00 saved it" is said of a PMO copy and a one-appropriation file as well, which the board published or
    exported (m4). A hand-made file whose working plan's list holds a number too large for JSON (1e400, read as Infinity) is
    told by ⬅ Import one appropriation that the entry is “null”, and is named no way (verification round 7, money m1): no
    ORBIT writes such a number (JSON writes it as null), nothing is taken and storage is unchanged; ⬅ Import a full board
    refuses it as "not a real number (“Infinity”)", as d66dd60's door did. The ✕ way is named for an RCN / EEIC list wherever
    the door meets one, a list in an appropriation that is not O&M included, whose 🗂 RCN / EEIC panel shows no rows (read, not
    run; no ORBIT writes such a list with entries; tests m1). ✕ on the FIRST row of a repeated key clears every assignment to that key, as its
    question says. The pickers and the menu's "N combos" list a repeated key's rows as they are. An entry keyed "" passes the
    door; no pointer can reach it (a pointer of "" means none). Packages, submittals and band ladders run the same door; the
    block drives a package, a PMO copy and a state file, not a band ladder; the sidecar's file:// branch is not driven (jsdom takes the
    fetch branch). Who saved a file is taken from the file's own BUILD line; a hand-edited file is believed. The SI sheet
    walks the fixed SI code list and was never affected. The PPBE view's "+ add an RCN / EEIC line" still takes its key from
    the time and the list's length, as Add RCN / EEIC did; PPBE totals count each key once, so no total doubles (read, not
    run).
- **U19 — ↶ Put back after a board-file save keeps what it replaces** (Brad, 12 Oct, about 5:30 PM ET: "Don't wait for me.
  Let's keep pressing throughout to get this next version published."; the lead's decision to fix the release blockers).
  With work saved into the board file (S1), ↶ Put back of the work kept aside (K) kept nothing in S1's place, because S1 was
  "still in the saved file it came from, and 💾 Save will ask before writing over that". Save did ask (its HOLD ON), but
  answered OK it wrote K over S1, and then S1 was in no copy this board could reach: not on screen, not kept aside, not in
  browser storage, not in a byte of the file, after the Save and after a reopen. It was left only in Teams version history,
  outside the board, where the file has one. The shared folder keeps the copy a save replaces in its history; a board file
  keeps none. Now ↶ Put back keeps what is on screen aside in the kept work's place, with the checkpoint it came from,
  whether or not it is saved, as unsaved work always was. The one exception is when 💾 Save writes to the shared folder at
  the put-back and what is on screen is the folder's own copy (the one last loaded from or written to the folder): that copy
  is in the folder, and a Save there keeps the copy it replaces in the folder's history. The choice is made at the put-back,
  so switching 📡 Live view from "● Working out of this folder" back to "○ Just watching" before the Save cannot leave work
  saved only in the board file unkept, also when the folder holds an older copy of the same browser's work. Whoever saved
  what is on screen, it is kept: the person's own save or a colleague's. Putting the kept copy back later restores it, and
  Save asks again before writing over the file. The question adds "It is also kept aside in its place, so it is not lost if
  Save does." When what is on screen is the shared folder's own copy and the work kept aside was kept at a put-back, the
  question now says it is "still in the shared folder it came from", also once 📡 Live view is switched back to the file;
  it said "the saved file", which never held that copy. A copy kept this way that was saved, then put back and not changed
  since, is not said to have "changes no saved copy has": the question says "What is on screen now was put back and has not
  been saved since, so it is kept aside in its place — nothing is lost." Changed after that, or on a freshly opened page, it
  is said to have changes no saved copy has, as before. With no room in browser storage to keep what is on screen, nothing
  is put back and nothing changes, as for unsaved work. With a locked cycle on screen, ↶ Put back stays refused before
  anything is asked or kept, by U10's gate (U10 12 of 12, above), so the view is never kept aside in the kept work's place,
  though saved work now is. The words for a copy kept at a put-back no longer call it work no saved copy had or say a saved
  copy replaced it: the top bar's ↶ work kept aside says "What was on screen when other work was put back, kept aside …",
  📁 File says "kept … · what was on screen when other work was put back", and putting such a copy back says "💾 Save will
  ask before it writes over a copy saved after the one this work came from." For the other kinds of kept work the status
  keeps U30's words ("… which <name> saved after it.", or, with nothing recorded for the folder, "… saved; this browser has
  no record of which copy there, if any, this work came from."). While work is kept aside, a reopen does not load the
  file's copy over unsaved work on screen, so the HOLD ON's Cancel line then reads "Cancel — don't save (then use ⬅ Import
  on the current file to pick up their changes first)." and the status after Cancel "… ⬅ Import this file to load their
  version, then redo your edits.", without "or reopen it" and "Reopen or", which were not true there: on the board before
  this change the old advice was already untrue after a put-back of unsaved work and after an opening that kept work aside
  (both now checked). With nothing kept aside, both read as before (also checked).
  - **What users may see:** after ↶ Put back, the top bar keeps offering ↶ work kept aside (what was on screen) until it is
    put back, saved as a file or discarded. In the shared folder too, when what was on screen was not the folder's own copy.
    While it is kept, a newer copy that would need work kept aside is not loaded, and the board says so, as it already did
    for unsaved work. The next 💾 Save then asks HOLD ON before writing over that newer copy in the file; answered OK, that
    copy is left only in Teams version history, as with any HOLD ON answered OK. This includes reopening the file before any
    Save after the put-back: K stays on screen, unsaved, and the file's copy (S1, the very copy kept aside) is not loaded
    ("… the newer copy was not loaded and nothing was lost"); before, S1 opened and K was kept. It also includes a newer
    copy saved into the file AFTER the put-back, from another browser or by a colleague (N2), with or without a Save since
    the put-back: the reopen does not load N2 over new work while the copy the put-back replaced is kept, and the next
    Save's HOLD ON, answered OK, writes the new work over N2, which is then only in Teams version history. On the board
    before this change, with a Save after the put-back, that reopen loaded N2 and kept the new work, and S1 was the copy
    lost; with no Save after it, the reopen loaded N2 and kept the work put back. The board keeps one copy aside: U19 spends
    it on the copy a put-back replaces. On a reopen the top bar says "Saved <time> · ↶ work kept
    aside" while the work on screen is unsaved by this browser's record. That is the board's existing opening behaviour
    (U15 in the ledger), now reached on this route too. After a saved copy is put back, the top bar says "Unsaved changes"
    though the file holds it: a put-back counts as a change (v2.00, U2). A put-back in a browser whose storage is full is
    now refused, with "nothing was changed", where it used to go ahead when what was on screen was saved.
  - **Test:** audit-import "v2.00 (U19) — put back after a board-file save keeps what it replaces" (161 checks, with the round-6 tests review's CONTROL (ae): ↶ Put back answered Cancel with
    saved work on screen keeps the work kept aside and offers it after a reopen), after the
    U18 block and before U20's. It drives the routes through the page's own buttons and menus: put back once S1's save has
    landed; put back while it writes (refused, U2) and again once it has landed; through 📁 File and the note editor; with
    no file handle remembered (the picker); between two writers, each with their own key (✍ Take the pen, both ways); with
    📡 Live view working out of a folder at the put-back and switched back to the file before the Save, with the folder
    empty and with the folder holding an older copy of the same browser's work; on a reopened page with no file handle in
    memory; and with a colleague's copy on screen (Bob's, written through ✍ Take the pen). Each route then runs 💾 Save with
    the HOLD ON answered OK and a reopen. It also covers K and S1 put back in turn before any Save; a saved copy put back
    and then changed; a reopen before any Save; no room in browser storage; the HOLD ON answered Cancel while work is kept
    aside (S1 saved, S1 never saved, and work kept by the opening); the question's words when what is on screen is the
    shared folder's own copy, in the folder, from the board file, and with 💾 Save back on the board file after K was written
    to the folder; when the folder holds an older copy and what is on screen is saved only in the board file; and the words
    for each kind of kept copy in the shared folder. The controls are the HOLD ON answered Cancel, S1 never saved, the
    shared folder, 📡 Live view left on at the Save, a freshly opened page's put-back question, a locked cycle on screen
    (U10's refusal holds with saved work on screen), a put-back the load itself refuses with saved work on screen (the kept
    work built for another service list: the kept work is still kept, byte for byte, after the refusal and after a reopen,
    and the top bar and 📁 File still describe it), the HOLD ON answered Cancel with nothing kept aside (its Cancel line
    and the status after it still name a reopen, and a reopen then loads the file's copy and keeps the work on screen
    aside), and ordinary editing. 75 checks fail on the board before the change (`a4881ec`'s, `058df67e`), none of them a
    control; all 86 control checks pass on both.
  - **Existing expectations changed (3 checks and 1 comment, in tools/export-audit/audit-import.mjs; line numbers before →
    after):**
    - L3512 → L3512–3514, v1.89 "the file is newer", "one click puts it back": the kept slot was empty after the put-back
      (`String(localStorage.getItem(_AP.key+'.kept')===null)` → `'true'`); it now holds the colleague's copy and not Brad's
      (`/COLLEAGUE NOTE/.test(s) && !/BRAD NOTE/.test(s)` → `'true'`). Why: the colleague's save was in no other copy this
      board could reach once Save's HOLD ON was answered OK.
    - L7725 → L7727, "v2.00 (U2) — put back waits for a save to finish", the `retry` helper's comment: what is kept is now
      also work saved only in a board file. Comment only.
    - L7795–7796 → L7799–7800, the same block, case (d) (the board file): "put back again" kept nothing (`null`) and now
      keeps S1 (`'S1'`). Why: S1 was saved only in the board file.
    - L7797 → L7801, case (d): the reopen after the Save showed S1 with K kept (`['S1', 'K']`) and now shows K with S1 kept
      (`['K', 'S1']`). Why: the file is newer than the copy K came from, K is unsaved and S1 is kept, so the file's copy is
      not loaded over K.
    Each was run both ways: the old text fails on the new board, and the new text fails on the board before. The other U2
    case that runs this route ("work put back during a save stays unsaved", case (c), L7626–7643) observes nothing new.
  - **Existing mutation entry changed (1, in tools/export-audit/mutate.mjs):** `v200-u10-kept-gate-after-question`
    (L4853–4855 → L4854–4856, with one comment line above it at L4853). Its find and its repl both carried the put-back's lines
    between U10's gate and the end of its question as they were before U19 (`const nowUnsaved=…` and the old `confirm(…)`),
    so on this board the find matched nothing. Now they carry U19's lines there (the `keepScreen`, `asPut` and `scrWhere`
    lines with their comments, and the question's new words); the mutation is the same: the gate moved after the question.
    The `what` text is unchanged. It is caught by U10's audit-recon check, as before (that block run on its own), and by
    this block's (y).
  - **Mutations (30):** `v200-u19-keep-saved-before-question` (the round-6 tests review), `v200-u19-putback-keeps-nothing-saved`, `-putback-promise-unkept`, `-putback-question-unsaid`,
    `-swap-status-names-saver`, `-swap-title-unsaved`, `-swap-menu-replaced`, `-putback-store-at-putback`,
    `-putback-folder-keeps-nothing`, `-putback-needs-handle`, `-putback-again-unsaved-said`, `-putback-again-any`,
    `-swap-saved-forgotten`, `-cancel-says-reopen`, `-swap-status-by-kept`, `-swap-title-any-kind`, `-swap-menu-any-kind`,
    `-putback-folder-base-any`, `-putback-words-swap-file`, `-cancel-swap-only`, `-putsavedgen-zero`,
    `-asput-ignores-edits`, `-putback-keeps-own-only`, `-putback-refused-no-restore`, `-putback-restore-unsaved-only`,
    `-putback-words-store-on`, `-putback-words-base-any`, `-putback-words-needs-store`, `-putback-refused-words-swap` and
    `-cancel-never-reopen`; each caught by the block's checks on this board (`ae564d6c`, run focused, scenario by scenario);
    full-suite sensitivity runs in the final-tree queue.
    U10's `v200-u10-kept-putback-in-view`, `-kept-gate-after-question` and `-kept-gate-silent` are also caught by (y).
  - **Not covered:** the file's own Change journal after K's Save keeps no trace of S1; S1 and its journal are in the kept
    copy. The HOLD ON still calls the person's own save "their changes" (the triage's O1), and after a take-the-pen route
    the put-back status still names the writer the kept work came from ("which Bob saved after it"). Reopened before any Save
    after a put-back, the "newer copy was not loaded" message calls S1 both "a newer copy" and the "earlier work" kept aside.
    For work kept by an opening or by Load theirs, the question still names the place by the kind of the kept copy: "still
    in the saved file it came from" when what is on screen was then saved only to the shared folder, and "still in the
    shared folder" when it was saved only to the board file. On the classic route, where this browser's own copy is the
    newer one and nothing is kept aside, the HOLD ON's Cancel line still names a reopen, which does not load the file's copy
    there. The Cancel line's ⬅ Import replaces the work on screen after its own "CONFLICT … will DISCARD" question, while the
    slot holds the other copy. All of these are wording points for Brad, not changed here. A newer copy from another browser
    or a colleague, arriving in the file after a put-back with or without a Save since, is lost on the HOLD ON's OK (above).
    The restore after a load refused because a kept copy lists the same services in another order and its "Import it?" is
    answered Cancel is not driven by a check (the same restore line as the service-list refusal, which is). A load that
    throws part-way, rather than refusing (a kept copy of a shape the board never writes, such as a year's state set to
    null), leaves what was on screen in the kept slot and the kept work in no copy; before this change, saved work on screen
    was not kept, so the slot still held the kept work (the money review's probe T; no route found that writes such a copy).
    A HOLD ON answered OK over another writer's file copy, not after a put-back, still leaves that copy only in Teams version
    history. The shared folder's own "Put this back" (📡 Live view → 🕓 Show what the folder kept) is not changed: put back
    over work saved only in the board file, it keeps nothing in that work's place, and the next 💾 Save to the board file
    writes over that work without asking (this browser's record still names that work's own file save), whether 📡 Live
    view was watching at the put-back or was switched back after it. Its question says "What is in the folder now is kept
    as well, so this can be undone." and its status "press 💾 Save to write it back to the folder for everyone", though
    💾 Save then writes the board file. The same on the board before U19; a new ledger row (U64). A second tab of the same browser
    driving these routes and a real browser (Chromium) were not run; U20's own block passes on this board.
- **U61 — an RCN / EEIC pointer of "__proto__" never loses or doubles money in the alignment lines or the ACE tie-out**
  (the round-8 money review of track cycreg, its SF2; ledger U61, written by the lead. It was there before this version: the
  same on `d66dd60` and on the board in use today. Not a release blocker (Brad, 18 Oct, about 5:00 PM ET: "Fix now, don't
  hold"): it joins v2.00 only if both reviews are clean before the final gate). The ACE alignment lines (the 🎯 alignment
  rows, `rcnKeysOf`, and the ACE tie-out workbook's Alignment Breakout by funding line) group a funding line's Air Force
  services by the RCN / EEIC combination each one points at. The grouping was a plain object, and in a plain object the
  pointer "__proto__" sets the object's prototype instead of a key. So each service on that pointer began its group again:
  R1, asking USAF $900 and ANG $200, with both on "__proto__" (by the requirement's own pointer or by each service's), was
  two lines of $200. USAF's $900 was on no line and ANG's $200 was on two: $400 where the requirement is $1,100. A prime's
  CLIN on "__proto__" was the same: $300 twice for a CLIN asking $400 / $300. So was a pointer that is not text but whose
  key reads "__proto__" (the list ["__proto__"], which a file can hold). Such a pointer passes the import door (the door
  does not check what the four pointer lists hold), a file opened directly passes no door, and no picker offers it.
  Now the services are grouped in an object with no prototype, where "__proto__" is a key like any other: one line, with
  all of the money. No combination in the list has that key, so the line's RCN and EEIC cells are blank. That means not
  assigned, which is how any pointer to a combination the list does not hold is shown, and how the RCN-EEIC by Month sheet
  already filed that money ("no RCN/EEIC assigned"). No other dollar moves: a line whose pointer does not read as
  "__proto__" is as it was.
  - **What users may see:** only with a file ORBIT did not write that holds the pointer "__proto__". The requirement's
    alignment rows and the tie-out's Alignment Breakout show one line with all of the requirement's (or the CLIN's) money
    and no codes. Before, they showed two lines of one service's money.
  - **Test:** audit-recon "v2.00 (U61) — an RCN / EEIC pointer of "__proto__" never loses or doubles money in the
    alignment lines or the ACE tie-out" (27 checks). The fixture: O&M, USAF / ANG / AFRC, everything funded. R1 asks
    900 / 200 / 0. P1 is a prime with one CLIN asking 400 / 300 / 0. There is one combination, K1 = 11111 / AAAAA, and one
    estimate line. The checks cover R1 on "__proto__" by `rcnAsg` and by `rcnSvc`, and P1's CLIN by `clinRcn` and by
    `clinRcnSvc`. Each gives one alignment line ([900, 200, 0] or [400, 300, 0]), and the tie-out's Alignment Breakout,
    read from its bytes, prints $1,100 and $700 once, with no codes. The board saved and opened again gives the same. On a
    second board, R2 asks 900 / 200 / 50: with its USAF and ANG on "__proto__" and its AFRC on K1 it is two lines,
    [900, 200, 0] and [0, 0, 50], each service's money once, and the same with USAF and ANG on the list ["__proto__"]; on
    "__proto__" with two WBS logged it is one line per WBS with that WBS's money. P1's CLIN on "__proto__" with two WBS
    logged that leave $100 / $100 on no WBS is one line per WBS and one for the remainder, each with its own money.
    Controls: K1; "constructor" and "toString"; "GONE"; USAF alone on "__proto__" with ANG on K1 ($900 with no codes, $200
    on 11111 / AAAAA); with R1 on "__proto__", the RCN-EEIC by Month summary (R1's USAF 900 and ANG 200 not assigned) and
    the Mapping by Requirement (no codes for R1; `rcnKeysOf` one key); the import door passing such a file; no jsdom
    errors on any of the three boards. 13 checks fail on `a4881ec`, where each case on "__proto__" gives two to five lines
    of one service's money, and on `d6fea76` and `1582295` with the same values. The 14 controls pass on all of them.
  - **Mutations:** `v200-uproto-plain-grp` puts the grouping back in a plain object. 13 checks fail, and the focused
    block catches it. The wrong fixes the tests reviews tried are caught too (they are not entries): keeping the plain
    object and only dropping the repeated line (the R2 checks fail: USAF's $900 is lost); leaving a line with WBS logged in
    a plain object (the two WBS checks fail); escaping only the text "__proto__" (the list check fails); leaving only a
    CLIN's WBS lines, or only the remainder line, in a plain object (the CLIN WBS check fails); and seven more.
  - **Not covered:** the sweep (track README) found no other place that groups or looks up money in a plain object by a
    pointer or code that a file can carry through the door. Some keys the door checks are still read in plain objects: a
    destination's key, a funds-flow category's key, an office name. They are read that way in the funds flow, the
    destination list's repair, the board workbook's PMO tabs, and the Spruills table's asks by office from another
    appropriation's year (an office named "constructor", "toString" or "__proto__" there stops the Spruills table and its
    PMO drill from drawing: read in code, not run). A file opened directly passes no door, so it can still carry such a
    name there (item 99's limit, unchanged). A combination's own key is not among them in this version: since U32/U33 the
    RCN-EEIC by Month sheet names a combination by its place in the list, never by its key, so with a combination keyed
    "toString" or "__proto__" the Excel workbook is built and files that combination's money on its own codes (run: probe
    `sweep-probe.mjs`, S1 and S2, at `d6fea76` and `1582295`, with and without this change). Outside money, a band
    pointer, a CCaR number or a control number of "__proto__" or "constructor" miscounts the band panel's counts, or stops
    the CCaR grouping's flags and the shared-control review (read in code, not run). The Alignment Breakout's note says "A
    blank cell means that line holds no money that code governs", which is not true of a line whose Air Force money is not
    assigned to a combination. That was so before this change for every such line (no pointer, or a removed combination),
    and it is unchanged. In the same way, the tie-out's Mapping by Requirement counts a pointer that names no combination as
    a combination: R1 with USAF on "GONE" (or "__proto__") and ANG on K1 prints "(2 combinations)" and "(see breakout)",
    though the list holds only K1. And the record panel shows a pointer to a combination the list does not hold
    ("__proto__", or "GONE") as "USAF (blank) · ANG (blank) · AFRC (blank)", in green, and counts its RCN / EEIC field as
    set, while RCN-EEIC by Month and the Alignment Breakout call that money not assigned (the money review's probe). All
    three are the same before and after this change. jsdom only; no browser or Excel was run.
- **UI chunks 1–3 and UI-C1 — the board's new layout: a navy sidebar, a context bar, KPI cards, a toolbar, an Import box
  and a RECORD panel that slides over the table; presentation only** (the concept follows Brad's two concept images,
  11 Oct; Brad, 12 Oct, 6:00 AM ET: "Fix UI M1 in chunk 3, with cancellation and failed-rollback tests" and "Update
  layout tests for the slide-over default while retaining checks for optional docking"; 6:11 AM ET: S1–S5 approved
  within his scopes; 7:12 AM ET: UI-C1 as a separate UI commit; 18 Oct, between 7:15 and 7:25 AM ET: the UI work is in
  v2.00, with his three verify:grid calls below). Built on its own branch, `claude/v200-ui`, from `4a6f7c7` (40 commits,
  `ba0def2` to `7df816c`), each part reviewed independently; v2.00 takes it by a merge that keeps every commit. All of
  it is switched on by `html.ui-on`, which `uiBoot()` sets as the last thing the program runs, after the page source a
  save writes (`SRC0`) is taken, so a saved board carries none of it. Measured against `4a6f7c7` at every board of chunk
  3 and UI-C1: the saved data is byte-identical on the same seed and clock, and opening the board writes the same
  storage keys in the same order and no UI key. The board's diff against `4a6f7c7` is insertions only (1,056 lines).
  Four existing functions are touched, and none changes what it computes or writes: `scoreboard()` hands the four
  figures it has just printed for the posture strip to the cards, in a try/catch (nothing is computed twice; the cards
  print them through the board's own `fM()`, in whole dollars); `drawerNarrow()` answers true while the panel slides
  over; `pmoTake` gains one comment line above it (S3); and `fitMenus()` is wrapped, its body unchanged (S5).
  - **Chunk 1 (11 Oct):** the sidebar (Requirements with a Review / Rank switch, Funding, Cycles & compare, Brief; FYDP,
    Execution and History & recovery flyouts, each item running the menu item's own function; Imports; Setup), which
    collapses to a 64 px icon rail; the context bar (the header restyled, with a Cycle control and an Editable chip);
    the page heading and four KPI cards (Total Ask, Discretionary, Mandatory, Total UFR); the toolbar (search, Filter,
    Columns, View, Import, Add requirement); the Import box (Full board, One appropriation, PMO Import: One submission
    or All submissions at once); and Overview / Funding / History tabs in the RECORD panel, which scroll to their part
    and hide nothing.
  - **Chunk 2 (11 Oct):** the RECORD panel slides over the table at every width, the board's own drawer; docked beside
    the table is a choice under View › Record panel, kept in this browser (`prio27uiDock`), and docked is the board's
    own layout. Each row is sized to the room it has beside the sidebar and the docked panel, and a nine-digit figure is
    not cut at any width from 700 to 1900 px (measured). The cards are guarded: a card that cannot be drawn makes all
    four read "unavailable", never stale figures. Brief shows the posture strip again. Add requirement shows in Review
    only, and PMO Import is hidden in a PMO copy, as the board's own menus do. The Cycle control offers the working plan
    and each locked cycle, read only, through the board's own `cycLeave` and `cycView`. "Last recorded edit" is shown
    only where the change journal answers for that requirement; Lifecycle reads "pending" (the board has no lifecycle
    field for a requirement).
  - **Chunk 3, M1 (12 Oct):** "All submissions at once" is all or nothing. A batch with a file that would ask a question
    is refused before anything loads, naming each such file, in the order picked, with its question, to be loaded on its
    own; the board's own `pmoTake` takes each file in the real run. If the run still fails part-way (a file not taken,
    Cancel, an error), the submittal review, the destination list (in place), every browser storage key that differs
    (and no other) and the save state are put back as they were once the files were read. "Nothing on the board was
    changed" is said only when a check of all of them finds each as before; otherwise the message says "⚠ NOT EVERYTHING
    IS AS IT WAS" and names each part that is not, with the browser's reason. A batch refused before it takes anything
    is measured against the board as it is when that is said (fix round 2).
  - **Chunk 3, S1–S5 (12–13 Oct):** S1, the posture strip wraps, so every control in it is on screen and clickable at
    every width; S2, a board-wide journal line (a load, the service list, changes past a save's limit, changes not
    recorded) recorded under another year suppresses "Last recorded edit"; S3, a refused batch from a board that reads
    Saved changes nothing and writes nothing, and the note at `pmoTake`; S5, a toolbar menu stays clear of the sidebar,
    so every Reports item is on screen and clickable at 760 and 1000 px; S4, the Import box gives the keyboard back to
    the control that opened it, and the browser tools are updated for the moved controls and the slide-over default,
    with a docked pass kept.
  - **UI-C1 (12–13 Oct):** `npm run check` failed from chunk 1 ("10 value(s) reach inline handler code without jsa()"):
    five handler arguments in chunk 1's code were hand-quoted. Each now goes through the existing `jsa()`; each handler
    makes the same call with the same value; `tools/check.mjs` is unchanged, and the check passes again.
  - **What users may see:** the new layout. The RECORD panel slides over the table by default; View › Record panel ›
    Docked brings back the panel beside the table. The figures, exports and saved files are those of the board before.
    Beside the open sidebar at a 1152 px window the context bar wraps to two lines (every control on screen, whole and
    clickable), and the first requirement row starts lower than before (below, under "Not covered"). A PMO batch with a
    file that would ask a question is refused, naming that file; after a failure part-way the batch says what it put
    back. In a browser whose buttons take no focus from a click (Safari; Firefox on a Mac), closing the Import box gives
    the keyboard back to the control that opened it.
  - **Test:** audit-ui (new; jsdom, the real board, synthetic data made at run time; `npm run audit:ui`, last in
    `audit:suites` and in the mutation sweep's `SUITES`): 616 checks at `7df816c` (M1 510, S2 56, S3 50), every expected
    value a hand-written literal; 278 fail on chunk 2's board (`f95fee2`) and 8 on the M1 board (`670c467`, S2's).
    Browser checks outside the gate: `ui-concept/preview-chunk3/checks/sweep3.mjs` (the posture strip: 0 widths with a
    control cut off or covered, against 111 on chunk 2's board; Reports: 0 problems, against 612). boot-same, audit,
    audit-other and audit-recon pass at every board of chunk 3 and UI-C1. UI-C1 was checked on `7df816c` against
    `dd15956` by an independent checker (13 Oct, 12:18–1:11 PM ET): `npm run check` fails before on the same 10 values
    and passes after; 24 clicks on the board and on its reopened saved file act the same; the saved payload is
    byte-identical (8,707 bytes); audit-ui counts per scenario and all 14 verify:grid tools' output are the same at
    both.
  - **Existing checks changed (S4, and Brad's row-controls call):** in `tools/dialogs-keyboard.mjs`,
    `tools/panels-render.mjs`, `tools/inspector-agrees.mjs`, `tools/editors-reachable.mjs`, `tools/keyboard-reach.mjs`
    (A, D, D2, F, L), `tools/toolbar-fits.mjs`, `tools/layout-fits.mjs` (C, D, E, F, I) and
    `tools/dropdowns-visible.mjs`; each change is listed with its old line, old rule, new rule and why in
    `ui-concept/CHUNK3.md` (part 2's S4 table and its fix round's "Old → new" table). No assertion was deleted or
    loosened: each check that depended on the panel being docked now runs twice, sliding over and docked, and says where
    the panel was. `tools/row-controls.json` is re-recorded (`node tools/row-controls.mjs --record`, Brad, 18 Oct): it
    was recorded from v1.91 (56 controls); the board now has 61, the five added being chunk 1's RECORD panel History
    links and tabs (`mRun(showLog)`, `mRun(toggleJrnl)`, `uiDTab('…')` three times), and none lost.
  - **Mutations (37, `v200-ui3-*`, one group at the end of `MUTATIONS`):** M1 26 (`-asks-loaded`, `-dry-asks-unheard`,
    `-no-putback`, `-putback-no-dest`, `-putback-dest-copy`, `-putback-no-storage`, `-putback-no-save-state`,
    `-putback-writes-all`, `-pick-lost`, `-claim-unchecked`, `-check-blind-storage`, `-putback-shallow-dest`,
    `-snapshot-before-reads`, `-check-blind-dest`, `-check-blind-plan`, `-check-blind-save`, `-check-blind-review`,
    `-check-blind-added-keys`, `-putback-dest-key-only`, `-early-measured-before-reads`, `-partway-before-run`,
    `-wrote-anyones`, `-reads-same-list`, `-snapshot-keeps-old-save`, `-check-ls-dest-only`, `-check-added-dest-only`),
    S2 7 (`-lastedit-year-first`, `-lastedit-services-only`, `-lastedit-writer-wide`, `-lastedit-removed-wide`,
    `-lastedit-no-year-filter`, `-lastedit-removed-ignored`, `-lastedit-whole-year-ignored`) and S3 4
    (`-dry-marks-unsaved`, `-dry-writes-journal`, `-dry-writes-storage`, `-dry-folds-dest`); each caught by audit-ui,
    run whole, at `dd15956` (UI-C1 then changed five other lines of the board, and every entry still matches it once;
    the mutation lanes at the merged tree run after the PR is merged, Brad, 18 Oct). S1, S5 and S4's focus fix are
    layout and focus, which jsdom cannot see; they have no entry and are held by `sweep3.mjs`, dropdowns-visible and
    dialogs-keyboard.
  - **verify:grid (Brad, 18 Oct, between 7:15 and 7:25 AM ET):** row-controls: the five new controls are RECORDED
    (above), so the check holds them. toolbar-fits at 1152 px and layout-fits D ×8: CARRIED as named limits (below). So
    `npm run verify:grid`, a chain that stops at the first tool that fails, still stops, at toolbar-fits, and each of
    its 14 tools is run on its own as well.
  - **Not covered:** two named limits, carried by Brad's decision: toolbar-fits' one-line rule, kept as it was, fails at
    1152 px in review and fund (the context bar has 920 px beside the open sidebar, under the board's own 1100 px wrap
    point, and takes two lines, 77 px); and layout-fits D fails at four sizes, sliding over and docked (×8): the first
    requirement row starts at 323 px against a 320 px limit at 1920, 1440 and 1366 px, at 453 px at 1024×768, and at
    420 px docked at 1440 (chunk 1's heading and cards; the chunk-2 review's m7, Brad's call on the look). The chunk-2
    review's other minors (m1–m5, and m7's lower-cased cycle label in the page subtitle; CHUNK2-REVIEW.md §7) are open,
    not selected: among them, Brief at a 390 px phone scrolls sideways by 21 px (m1), and after a batch that replaces an
    office's submittal the status line does not say so (m2). Still open from M1: "nothing on the board was changed" is
    measured from once the files were read, so a change made by something else while they are read is kept and not
    named; a failed put-back step gives its reason as "(Error)"; the storage-refused message names no remedy; Chromium's
    alert box scrolls after about nine lines; and the `v200-ui3-*` entries have no `FIRST_BY_PREFIX` route (they go to
    audit-inject first; the verdict is the same). verify:grid in a lane without the container's Segoe UI → Inter
    substitution, and on Windows itself, is U28's (ledger).
- **U37 — no export writes a character XML 1.0 forbids; it is refused before a byte, and says where** (a release blocker,
  the lead, 13 Oct, 12:02 PM ET; built from Codex's independent proposal, batch A2, after review, and extended to the slide
  deck; corrected after eight rounds of independent review). The one text writer both exports use, `_xesc`, escaped
  `& < > "` and nothing else, so U+0000–U+0008, U+000B, U+000C, U+000E–U+001F, U+FFFE and U+FFFF went into a workbook part,
  or a slide of the deck, as they were, and that part was not well-formed XML. An ordinary paste puts them there: Chromium
  141 keeps U+000B, U+0001, U+0007 and U+001F pasted into a text field, and the board stores them. A board file can carry
  them too (ledger U46: U+FFFF in a saved prime-match token or OGC category name; and a band's colour, which the workbook
  writer put into `xl/styles.xml` with no escape at all). Measured on the base (`7ee498a`): a Plan Event typed with U+000B
  went raw into four sheets of the Excel export (Decision Bands, CR Cash Needs, Funded - Discretionary, PMO AV), two of the
  Priority drill, the Spend Plan Source, the IDS workbook and slide 5 of the deck; an RCN / EEIC title with U+0001 and
  U+000B into RCN-EEIC by Month; a funds-flow destination named with it, into three sheets of the Funds Flow workbook; a
  saved prime-match token or category name with U+FFFF into the Funds Flow workbook, the category name into
  `xl/workbook.xml` as a sheet name; a band colour carried in a board file with U+000B, U+FFFF or a double quote into the
  Priority drill's `xl/styles.xml` as that band's banner fill, while the drill said "Priority drill exported". LibreOffice
  24.2 opened such a workbook with the sheet cut off at that cell, and the deck with the rest of the Mission Critical table
  gone, its TOTAL and its MC SHORT row with it, and said nothing. Every workbook and the deck are now checked before a byte
  is made: each sheet name as it is written (its first 31 characters), each text cell, a styled one included, each style's
  fill colour (it must be six hex digits, `#RRGGBB`) and number format, and each slide. Such a character, or a fill colour
  in any other form, refuses the export, and the alert and the status line name the place (the sheet and the cell; the band
  whose colour it is; or the slide, its title and the text) and show the text around it with the character spelled out where
  it sits. A band's colour has no field on the board, so its refusal says that, in place of "change that text where it was
  entered", and names what can be done, with what each way costs. A workbook also refuses a literal `_xHHHH_` (upper- or
  lower-case hex), because a spreadsheet reads it as the one character it spells (LibreOffice shows `_x0041_` as "A" and
  `_x000B_` as U+000B); the refusal names that character, which is what the person sees in a file the text came from. The
  deck carries such text as typed. Each of the 16 routes that write a workbook, and the deck, stops there: before a Blob, a
  download, its own "exported" line, or anything it keeps (the IDS export's ORG). The IDS box, if open, no longer gives an
  earlier prompt problem as the reason. The funds-flow chart's "Save as image" reads the drawn chart back as an XML image:
  with such a character in a drawn name a browser could not render it and said only "Could not render the chart to an image"
  (Chromium, measured); it is now refused before its Blob, naming the text. The words stay true once the person acts on
  them: the refusal stays on the status line only until a workbook is made after it (the Excel export and the ATR/BTR log
  say nothing of their own, so it used to stand over a file just made), and the alert says that a locked cycle keeps the
  text it was locked with, so a file taken from one that holds it stays refused (the cycle's view cannot change it, and
  changing the working plan does not). Nothing is cleaned or cut: the text and the colours on the board stay as they were,
  and an export without such text is byte for byte what it was (all 17 routes, frozen clock, base and fix; the chart image
  still downloads in Chromium). Codex proposed the refusal, not the OOXML `_xHHHH_` escape: the board's own workbook reader
  keeps `_xHHHH_` as written, so escaping would change how the board reads back its own workbooks.
  - **What users may see:** an export refused with, for example, "Excel workbook not exported: sheet “Decision Bands”, cell
    H18 holds character U+000B, which ORBIT cannot write into a workbook without damaging it. It reads “Plan[U+000B]event”.
    No file was made, and the text on the board is unchanged. Change that text where it was entered — on the board, or in
    the file it was imported from — and export again. A locked cycle keeps the text it was locked with: a file taken from
    one that holds it stays refused." The Priority drill, for a band colour a board file carried: "Excel workbook not
    exported: the colour of band 0 “Net Funding Available” (its banner on the Priority drill) holds character U+000B, which
    ORBIT cannot write into a workbook without damaging it. It reads “1B2A4A[U+000B]”." -- or, for a colour in another form,
    "… is not six hex digits (#RRGGBB), the only form of colour ORBIT writes into a workbook. It reads “FF6B81"”." Its alert
    goes on: "No file was made, and nothing on the board is changed. A band’s colour has no field on the board: it came in
    as written, with a board file or a ladder from another appropriation." -- for a standard band (one whose id is the
    standard's), "This is a standard band: ⚖ Bands › ⚙ Install standard 0–4 puts the organization’s standard bands back as
    issued — colour, name, description, rule, whether each counts toward the stoppage gap and needs a consequence, a removed
    one included — at the top of the ladder in the standard order, and files none of them under another band (a standard
    sub-band becomes a band of its own, its money no longer in its header’s total, and the bands below it are renumbered).
    It asks first." (the range as the panel's button reads it: 0–3 when a standard band is filed as a sub-band) -- and for
    every band, "⬆ Import ladder takes a ladder file with the colour corrected to #RRGGBB (⬇ Export ladder makes one), but
    drops every sub-band filing — each sub-band becomes a band of its own, its money no longer in its header’s total, and
    the bands below it are renumbered — and cuts a band’s name to 60 characters and its description to 120." When another band's colour is refused too (a sub-band
    takes its header's colour, so a sub-band of the office's own under band 0 holds band 0's), the alert names it -- "The
    colour of band 0a “Readiness degradation” is refused too, and each has to be put right." -- offers ⚙ Install standard
    only when it puts back every band whose colour is refused, and its import sentence reads "a ladder file with each of
    these colours corrected to #RRGGBB". In a locked cycle's view, where nothing done is kept, the band words end "In a
    locked cycle’s view nothing done is kept: ↩ Leave the view and do it on the working plan, whose bands the view reads."
    The deck says
    "PowerPoint deck not exported: slide 5 (“Mission Critical — Must-Pay Requirements”) holds character U+000B, which ORBIT
    cannot write into a deck without damaging it, in the text “Plan[U+000B]event”." The chart image says "Chart image not
    exported: the chart holds character U+000B, which ORBIT cannot draw into an image, in the text “Ctl[U+000B]”." A
    workbook holding the text `_x000b_` or `_x000B_` is refused the same way, "which a spreadsheet would read as the single
    character U+000B". The status line says the same in short ("⚠ Excel workbook not exported — … No file was made; the text
    on the board is unchanged.") and is cleared when a workbook is next made; a line said after it stays. Text imported from
    a workbook another program wrote can hold such a spelling: LibreOffice saves a U+000B as `_x000b_`, the board's reader
    keeps it as written ("Engine_x000b_spares"), and a workbook that carries it is now refused, naming the cell; the person
    corrects the file it came from and imports it again. A cycle locked while its text held such a character keeps it: the
    FYDP spend plan taken from that cycle, and every export in its view, are refused while it holds it.
  - **Test:** audit-recon "v2.00 (U37) — no export writes a character XML 1.0 forbids; it is refused before a byte, and says
    where" (118 checks): each of the 31 characters in a cell; a styled cell; text that reads as a number holding U+000B
    or U+000C (`2027` with U+000B after it, U+000C before `12`, a lone U+000B -- JavaScript reads both as white space); the words, whole; a sheet name, and U+000B as
    its 31st character; a literal `_xHHHH_` in a cell and a sheet name, in lower- and in upper-case hex; a style's fill
    colour holding U+000B or a quote, after its six digits or before them, or of three or of eight hex digits, or with a `#` inside its
    digits (`#1B#2A#4A`), and a number
    format holding U+0001 (CONTROL: a colour with its `#` and one in lower case, a source format with quotes, a format-only
    style and the default fill are written as before); the status line showing markup in the refused text as text; a long
    text quoted around the character; the deck, and the deck quoting `R&D` as typed; where a person meets it (exportExcel,
    exportCSV, exportSrc, exportFlow -- a destination named `Ctl` and one named `2027`, each with U+000B, kept as typed --
    and the IDS export, each naming the cell the base wrote the character into, the IDS ORG
    not kept, and the open IDS box no longer giving a missing reason as the reason; exportExcel for an RCN / EEIC title,
    which it writes only in styled cells; the funds-flow chart's Save as image, the chart drawing a destination named with
    U+000B); once the person acts (refused, retyped through the board's own field, made: the refusal is gone; the chart
    image's refusal goes when a workbook is made; a line said after a refusal stays; the deck says its own word); a cycle
    locked while the Plan Event held U+000B (the working plan retyped and made; the FYDP spend plan from the cycle refused
    at By Requirement B7 with the locked-cycle words; the cycle's view still holding the text and refusing); a board file
    carrying U+FFFF in a saved prime-match token and in a saved category name (ledger U46: refused at Funds Flow A52 and
    A34, where the base wrote it; the file as saved makes the workbook); a board file carrying a band colour with U+000B,
    U+FFFF or a double quote (the Priority drill refused, the band and the colour named; the file as saved makes the drill),
    and a sub-band's colour, the refusal naming the sub-band by its label (0a); the words for a refused band colour, and
    each way they name, done (a standard band's colour put back by ⚙ Install standard, the drill then made; a band of the
    office's own with a sub-band and a long name: ⬇ Export ladder, the colour corrected, ⬆ Import ladder -- the drill made,
    the sub-band a band of its own, the name cut to 60 and the description to 120, as the words say); ⚙ Install standard's
    costs, done (a standard sub-band, 0a, is told Install standard files no standard band under another, and done, 0a reads
    1 and the drill is made; a ladder with a standard band removed, a band of the office's own above a standard band and a
    tick cleared: done, the standard bands are back on top in the standard order, the removed one among them, the tick as
    issued); a band is called standard only when its id is the standard's (a band of the office's own filed under band 0,
    one named PDM-Directed Funding and one a file marked standard are refused with the import's words only, and ⚙ Install
    standard, done, leaves each refused; band 0 whose file dropped its standard mark is told, and Install standard makes the
    drill; the words name the button as the panel shows it, 0–3 when a standard band is a sub-band); a sub-band un-filed by
    either way takes its money out of its header's total, as the words say (band 0 with 0a and band 4 with 4a: the drill's
    Summary and 1-N by Band carry both totals, CONTROL; after ⚙ Install standard band 0's total is gone and band 4's stays,
    as band 5's; after ⬆ Import ladder no total is left); two bands holding a refused colour (band 0 and its sub-band 0a,
    a band of the office's own that took its colour: both named, ⚙ Install standard not offered, the ladder file with each
    colour corrected imported and the drill made; CONTROL: two standard bands so refused are both named, Install standard
    is offered and, done, the drill is made); a refused band colour in a locked cycle's view (the words say nothing done
    there is kept and where to do it, and on the working plan they do not; ⚙ Install standard done on the working plan, the
    view's drill is made); three bands holding a refused colour (bands 0 and 1, both standard, and band 6, the office's
    own: the other two named, in the plural, and ⚙ Install standard not offered, since it leaves band 6 refused); the band
    named first the office's own and the other standard (Readiness degradation moved above Safety-Critical & Must Fix, both
    refused: Install standard not offered); two bands so refused in a locked cycle's view (both named, and the view's
    sentence after them); the deck and the chart image refusing U+FFFF as the workbook does (a Mission Critical Plan Event
    holding U+FFFF, typed through the pen: no deck, slide 5 and its title named; a destination named `Ctl` with U+FFFF, the
    chart drawn: no image); a cell past column Z named by its two letters (an RCN code holding U+000B, kept as typed: the
    Spend Plan Source refused at O&M Raw Data AB2, the RCN column); and every caller --
    the 16 workbook routes and the deck, each made on ordinary data and then stopped by a stand-in refusal with no Blob, no
    download, no word after it and nothing changed. 92 checks fail on the board before the change (at 7ee498a and at
    e85dfb7, measured again at integration); the 26 that pass on both
    are the controls (escape-like text a spreadsheet reads as written; ordinary text with a TAB, a line break, an emoji and
    half of one, read back by the board; a sheet name whose character lies past the 31 written; a carriage return; the deck
    with `_x0041_`; each route making its file on ordinary data, and the chart image's drawing on ordinary data; U+0085,
    U+007F and U+009F, which XML 1.0 allows, in a cell, written and read back, and a Plan Event holding U+0085 making the
    Excel export and the deck) and the two no-page-error checks.
  - **Mutations:** `v200-u37-xlsx-unchecked`, `-pptx-unchecked`, `-name-unchecked`, `-cell-unchecked`, `-literal-unchecked`,
    `-nonchars-allowed`, `-vt-allowed`, `-wrong-cell`, `-show-raw`, `-stat-silent`, `-wrong-slide`, `-ids-org-kept`,
    `-ids-stale-note`, `-name-past-31`, `-cr-refused`, `-advice-board-only`, `-png-unchecked`, `-png-markup`,
    `-guard-<route>` for each of the 17 callers (`exportrlgplan`, `pmoreport`, `crexport`, `exportidsreq`, `exportflow`,
    `exportexview`, `exportsrc`, `exportplans`, `exportfydpplan`, `exportcyccompare`, `exportreprog`, `exportfcview`,
    `exportcsv`, `exportacetieout`, `exportexcel`, `exportcoa`, `exportppt`), and from the reviews `-styled-unchecked`,
    `-stat-unescaped`, `-name-30`, `-show-start`, `-show-literal-start`, `-deck-markup-shown`, `-made-missing`,
    `-made-always`, `-stood-unset`, `-locked-unsaid`, `-literal-char-unnamed`, `-literal-lowerhex`, `-style-unchecked`,
    `-fill-badch-only`, `-fill-hash-kept`, `-fmt-unchecked`, `-band-unnamed`, `-band-wrong`, `-fill-noanchor`, `-fill-3to8`,
    `-band-index`, `-band-how-unsaid`, `-how-ignored`, `-band-how-none`, `-band-std-unsaid`, `-band-std-every`,
    `-band-std-unfile-unsaid`, `-band-std-ticks-unsaid`, `-band-std-money-unsaid`, `-band-imp-money-unsaid`, `-std-by-name`,
    `-std-by-mark`, `-std-by-place`, `-std-mark-needed`, `-how-of-header`, `-std-shape`, `-band-also-unsaid`, `-band-also-std`, `-band-also-file`,
    `-cell-numeric-text`, `-fill-strip-all-hash`, `-band-view-unsaid`, `-band-view-always`, `-band-view-overwritten`, `-band-also-first-only`,
    `-band-also-skips-self`, `-band-also-singular`, `-band-also-first-named`, `-deck-c0-only`, `-png-c0-only`,
    `-col-a-to-z` and `-c1-refused` (87); each
    caught by the focused block (full-suite sensitivity runs in the final-tree queue).
  - **Not covered:** Excel and PowerPoint themselves (LibreOffice 24.2 was run; Office was not), so whether Excel writes a
    cell's carriage return as `_x000D_` -- which would make an Excel-written source with such a line break refuse the
    workbooks that carry its text -- is not measured (LibreOffice writes it back as a line feed). Half of a two-part
    character is not refused: the browser's encoder writes U+FFFD in its place, which XML allows, and the board's own cuts
    make one out of a whole emoji (a title at 44 characters on CR Cash Needs and 56 on the deck, a PMO sheet name at 31, a
    funds-flow sheet name at 28 -- U42); refusing it would refuse the Excel export for an emoji in a title and the Priority
    drill for one in a PMO's name. A carriage return in a cell is written as it is, and a standards XML reader gives it back
    as a line feed; a TAB or a line break in a sheet name is read as a space (both allowed by XML; not changed here). The
    limit, by Brad's decision of 19 Oct: a literal `_xHHHH_` in imported text is REFUSED in a workbook, as a named limit.
    The export is refused and names the cell; the user corrects the source and imports again. Decoding such codes at
    import goes to the post-merge list (the board's reader keeps a workbook's `_xHHHH_` as written, so imported text can
    hold one, above). The refusal names a
    place in a file that was not made (the sheet and cell it would have been); the quoted text is what finds it on the
    board; the requirement or field is not named, and neither is the appropriation when a sheet carries another
    appropriation's text (the FYDP spend plan's PMO tabs read the other appropriations' plans). A band colour has no field
    on the board, and none of the ways round a refused one is free (measured on this commit's board, `FR3-P-remedy-*`; the
    import's losses are the same before this change): a board file corrected by hand (the band's `c`, as `#RRGGBB`) opens
    with the corrected colour only if nothing was changed in that browser since the file was opened -- after any change, the
    browser's own newer copy opens, the old colour with it, and a file whose saved time is moved past it opens with that
    browser's work kept aside -- so the refusal does not offer it; ⚙ Install standard puts a standard band's colour back
    with the whole standard set as issued -- name, description, rule and both ticks, so the stoppage gap can change, a
    removed standard band included -- at the top of the ladder in the standard order and filed under nothing: a standard
    sub-band becomes a band of its own, the bands below it are renumbered, and its money leaves its header's total (the
    drill's and its Summary's total row for that header goes); the refusal says so, but Install standard's own question
    says only that the office's bands stay below in order and that no requirement loses its band (measured, verify-money r4
    `P-std-*` and `FR4-P-roll-*`; the same before this change; a candidate ledger row); ⬆ Import ladder takes a ladder file
    with the colour corrected, but drops every sub-band filing (a sub-band becomes a band of its own, its money leaves its
    header's total, and the bands below it are renumbered), cuts a name to 60 characters and a description to 120, and its
    question still says "Every banded requirement keeps its band" (a candidate ledger row; an uncorrected colour it turns
    grey). Install standard is named only for a band whose id is the standard's: a band of the office's own renamed after
    a standard one, or marked standard by a file, is given the import's words only; and it is named only when it puts back
    every band whose colour is refused (a sub-band of the office's own that took a standard band's colour it does not put
    back). ⬇ Export ladder writes each band's colour as it stands, so its file can carry a colour the import door refuses
    (`#` and 3 to 8 hex digits), and the door then says the file "is damaged or was not written by ORBIT" -- untrue of
    ORBIT's own ladder file (measured, verify-money r5 `V5-P-hdr-*`; the same before this change; a candidate ledger row);
    the refusal asks for each refused colour to be corrected in that file, so a person following it does not meet those
    words. A colour of three or eight
    hex digits, which the import door's rule accepts (`#` and 3 to 8 hex digits, by reading), now refuses the Priority
    drill, where the base wrote it as given (`FFABC` for `#abc`, not the eight hex digits a workbook's colour is); a `#abc`
    could instead be written as `FFAABBCC`, the colour the board draws -- the lead's choice, not taken here. A band colour
    that is not text at all stops the drill with an error, as before (not a character XML forbids). Number formats are all
    the board's own constants; they are checked anyway. A refusal's line stays after a CSV, a board file or another file
    that is not a workbook is made with no line of its own (the Exec Funding Synopsis CSV, the state file); it speaks only
    of the file it names. The Spend Plan Source asks about blank Budgets before this check runs, so a person can answer that
    question and then be refused for the character. The quoted text can cut a two-part character at its 30- and 60-character
    edges (the alert and the status line only). The chart image still fails without naming the place when a drawn text holds
    a no-break space (the drawing is read back as XML and `&nbsp;` is not an XML name; measured in Chromium; not a character
    XML forbids, and the same before this change). After a refusal from the open IDS box, the box itself shows no trace of
    it (the alert and the status line say it); a literal `_xHHHH_` typed into the box's own Reason passes the box's check
    and is then refused at the writer, naming the cell, with the answers typed kept and the ORG not saved (measured,
    verify-money r5 `V5-P-near-c1`; a literal `_xHHHH_` refused, the named limit above). CSV, JSON, HTML and text exports are not XML and are unchanged. A
    workbook or deck exported before this change is not repaired.
- **U44 — a destination list that repeats a key, or holds a key the funds flow keeps for its own rows, never prints money
  twice; a file handed over with one is refused, and the user's own board is put right as it comes across** (found by the
  lead's integration dry run, 13 Oct; a release blocker by the lead's decision of 13 Oct, the same class as U32/U33). The
  funds flow made one row for every entry of the destination list. A list holding the key dA twice ("Alpha Depot") printed
  dA's row twice in the Funds Flow workbook, with its money twice in every row and sheet but the OGC total: on the synthetic
  fixture (R1 asks USAF $900 and ANG $200 and goes to dA, R2 asks USAF $300 with no destination) Alpha Depot $1,100, Alpha
  Depot $1,100, Not yet assigned $300 beside an OGC total of $1,400, and OGC Detail summing $2,500. An entry keyed
  "unassigned", the key of the flow's own "Not yet assigned" row, printed that row twice at $1,400 and lost the entry's name,
  "Depot U"; "destsplit" did the same to the split row. A key that is a number (1) put R1's money under Not yet assigned
  beside "Depot One", where the board showed R1; the number 1 beside the text "1" printed "Depot Text" twice; an entry keyed
  "work" was broken out by Workforce's rungs on the panel. Every such file passed the import door, ⬅ Import a full board
  kept the keys as they were, and the double print came back on every reopening, view and saved copy. Now:
  - The import door refuses a file handed over (every file the door checks but the user's own board taken whole and the
    team's own copies) whose destination list -- the board's, a plan's or a locked cycle store's copy, a package's or a
    submittal's -- repeats a key, holds "unassigned" or "destsplit", holds a key that is not text, or holds an entry that is
    not a destination or has no key. It says which list, what it holds and why, and what is true for each kind of file;
    nothing is taken and browser storage is unchanged.
  - The user's own board taken whole by ⬅ Import a full board is PUT RIGHT AS IT COMES ACROSS, in every list the file holds
    (the board's, each plan's copy, each locked-cycle store's): an entry keyed "unassigned", "destsplit" or by something
    that is not text takes a key of its own, and every requirement on it -- its Goes to and its ultimate recipient, in every
    plan and every locked cycle -- goes with it, exactly (the number 1 is not the text "1"); a later entry that repeats a key
    takes a key of its own with nothing on it, its kind and match terms kept, and every requirement on the key stays on the
    first entry with it; a repeat that says nothing its first entry does not (the same name, kind and match terms) is left
    out; an entry that is not a destination, or has no key, is left out, as every board leaves it out on opening. The map an
    older list was read through, and a kind another appropriation named, follow the new key. That key is THE SAME ON
    EVERY BOARD that puts the list right ("unassigned" takes "dunassigned", "destsplit" "ddestsplit", the number 1
    "dnumber1", true "dbooleantrue", and a repeat the key its place among the entries with its key gives -- the first
    repeat of dA "ddar1", the second "ddar2" -- a place that counts each repeat ✕ removed here, which ✕ (and a list reset, for each repeat it removes) keeps as
    removed under that key, and each place a reading already gave its key; where the list already uses that key, or removed it, or the key
    a repeat repeats was marked removed by an older ORBIT's ✕, one is made at random), and a board not yet put right reads
    that key as its own entry, from its list as it stood before the reading -- a reserved or non-text key through it, a
    repeat taking it -- so two boards that hold one list, whether both or only one has been put right and whether or not
    either removed a repeat in this version, name each destination by one key, and a package or a return between them puts
    each requirement on the destination the board that sent it showed it on, renamed on either board or not (with a key
    made at random on each board, or a destination joined by its name, a manager's return came across with R1 and its
    money on a second "Depot U", or R2's on a second "Bravo Yard", after a rename; with a place counted on the list as it
    stood, R2, put on Charlie Yard on a board that had removed Bravo Yard, came across on Bravo Yard on the other board, and
    after a rename on a second "Charlie Yard"; Not covered says where a key is still made at random).
    The key each reserved or non-text key moved to is kept with the list, so a copy of the list the file does not carry -- the
    plan and locked cycles of an appropriation it keeps as this browser had them -- follows it: opened, that appropriation's
    requirements are on the destination the board showed them on (before, they were read by the old name, and a renamed
    destination came back as a second one with their money on it); its requirements count for ✕ on that destination; a destination removed here stays removed, under its old key,
    the key it moved to, or the key of its own every other board gives it (removed under the new key, it came back when
    the kept appropriation opened; removed as "unassigned", it came back with a manager's return, put right); Put it
    right, and a later full import of an older file of the user's own, move the key the same way; and where one list of the
    file holds both the old key and the key the record names, that list's own entry is read. The question asked before
    anything is replaced, and the reopened board's report, say what was put right. An appropriation the file does not carry
    stays as this browser had it -- with its copy of the list as it was (next bullet).
  - A board that carries such a list in any copy -- its own list, or the copy another appropriation's plan or store of
    locked cycles keeps (only a board an ORBIT before this one left in this browser, a file no ORBIT wrote, or an
    appropriation a full import did not carry) -- says so ON EVERY OPENING, from the moment it opens and after the line the
    opening ends with (its saved file; the board file with this browser holding the board; this browser's newer copy; the
    state file beside the board answering, however late; the shared folder answering), once, and at the top of 📍
    Destinations, naming whose copy holds what. Until it is put right it publishes no PMO copy and issues, pushes or sends
    back no package (⬆ Send my work back, ⬆ Send back), saying why (a board of this version would refuse each, and a PMO
    copy cannot put its list right). **Put it
    right** takes the board as it stands -- built from what is on screen and in this browser, without saving it first --
    through ⬅ Import a full board, which asks first, writes everything or nothing and reopens; answered No, nothing is
    written. It is refused while a full import that stopped part-way holds saving over the board file, and while a locked
    cycle is on screen. A PMO copy that an ORBIT before this one published from such a board runs that ORBIT's code and
    says nothing of it; its office learns only when this board refuses its submittal, and makes its changes again in a new
    copy (Not covered).
  - The team's own copies (the shared folder's, the sidecar, through fetch or XMLHttpRequest) are read as before -- except a
    copy whose list holds a key that is not text, which is refused like a file handed over (read, the number 1 and the text
    "1" were one destination: a requirement on one came across on the other, and the other's entry was dropped). Reading a
    copy -- or a package's list -- into the board's reads the FIRST entry with each key in that list (a later one with
    that key is its repeat, not read); an entry the board finds by none of its keys is joined by name only to an entry that
    is the first with its key here, never to a repeat (joined to a manager's board's repeat of dA, R2, on Bravo Yard on the
    board that sent it, was read as Alpha Depot); and an entry keyed "unassigned" or "destsplit" comes in under a key of its
    own, its requirements re-pointed with it. The questions a merge or a load asks compare each requirement's destination by
    the entry this board reads its key as, so they never name "destinations (n)" the take does not change (a board not yet
    put right, merging a return put right, said it discarded "destinations (1)" while R1 stayed where the board showed it).
  - The funds flow, its panel, drill-down and the Funds Flow workbook count each key once, under the first entry with that
    key (the one every requirement on it reads), and never under their own "Not yet assigned" or split rows; requirements
    on 1 and on "1" are two destinations.
  - Where a destination is picked (Goes to, Which awards to, the bulk setter) each key is offered once, as that entry; the
    destinations panel still lists every entry, marks one that repeats an earlier entry's key ("⚠ repeats Alpha Depot"),
    and ✕ on it removes that entry alone -- no requirement changes -- and keeps it as removed under the key of its own it
    would take, so every later repeat keeps its place; ✕ on the entry a repeat repeats is refused until the
    repeat is gone, naming the repeat by its mark when both have one name. The menu counts each destination once.
    Resetting the destination list keeps each repeat it removes as removed under the key of its own its place gives, as
    ✕ does (kept by its key only, a return from a board put right brought the reset destinations back, unasked and
    unsaid; verify-money r7).
  - **What users may see:** a file carrying such a list is refused, the board unchanged: "⚠ Nothing imported —
    “own-board.html” was refused: the destination list at the saved state.appns.om.flow.ents holds the key “dA” twice
    (ents[8] and ents[9]); a key names one destination.", and the alert adds: "A destination list names each destination
    once, by a text key of its own that the funds flow does not keep for one of its own rows. An ORBIT before this one took
    such a list without a word and could save it and send it on; a board of this version that holds one says so each time
    it opens, and publishes no PMO copy and issues or sends back no package until it is put right. A whole board of your own comes across
    by 📁 File → ⬅ Import a full board, which puts its list right and says first what it changes; that replaces what this
    board holds with everything the file carries, so it is not the way to take one appropriation. A package, a PMO copy or
    one appropriation is taken once the board that wrote it has put its list right and written the file again. A submittal
    comes from a PMO copy, which cannot put its list right: the board that published the copy puts its list right and
    publishes a new one, and the office makes its changes again in the new copy. Nothing on this board was changed." (An
    entry that is not a destination, or has no key, is refused in the door's usual words.) ⬅ Import a full board's question
    gains a line such as "The destination list, put right as it comes across (a file handed over with such a list is
    refused): it holds the key “unassigned” (ents[8]). An entry keyed “unassigned” or “destsplit” — keys the funds flow keeps
    for its own rows — or by something that is not text takes a key of its own, and every requirement on it, in each plan
    and each locked cycle, goes with it", said again by the reopened board. A board that carries such a list says, after the
    opening's own line: "⚠ The destination list holds what a file handed over is refused for: it holds the key “unassigned”
    (ents[8]). The funds flow and every export read it right — each key once, under its first entry, never under the flow’s
    own rows — but a board of this version refuses a file handed over that carries such a list, and the file this board
    saves carries every copy of it. Until it is put right, this board publishes no PMO copy and issues or sends back no
    package. Put it right — each such entry takes a key of its own, its requirements with it, the way ⬅ Import a full board
    puts a board right. It asks first." (for another appropriation's copy: "… for: Full Fund’s plan carries a copy of it that
    holds the key “unassigned” (ents[8]) …"). 📤 Publish PMO copy, ⬆ Issue, the baselines' push, ⬆ Send my work back and ⬆
    Send back are refused on such a board (“Sending the O&M return package is refused: …”):
    "Publishing a PMO copy is refused: the destination list holds what a file handed over is refused for — it holds the key
    “unassigned” (ents[8]). A board of this version refuses a file that carries such a list, and a PMO copy cannot put its
    list right. Put it right first: the button in the message line, or in 📍 Destinations. Nothing was written." A team's
    copy holding a key that is not text is not read: "a copy in the shared folder was refused: the destination list at the
    file.store.flow.ents holds a key that is not text (ents[8].k is the number 1); a key is text". A board that already held
    such a list prints each destination once: its OGC rows and sheets fall by the doubled amount and add up to the OGC total.
  - **Test:** audit-recon "v2.00 (U44) — a destination list that repeats a key, or holds a key the funds flow keeps for its
    own rows, never prints money twice: a file handed over with one is refused, and the user’s own board is put right as it
    comes across" (269 checks; 196 fail on 7ee498a). Ten lists (dA twice with one name and with two, "unassigned" with PB27
    locked, "unassigned" twice, "destsplit", "destsplit" twice, the number 1, the number 1 beside "1", "work", dA twice on
    the ultimate-recipient axis) and the control dA / dB, each through the routes that apply, the money read from the
    workbook's bytes against literals worked by hand: the user's own board; the door, ⬅ Import one appropriation and ⇊
    Import several boards (refused in literal words, storage byte-identical); ⬅ Import a full board (the question's line),
    the same browser reopened (the list put right, R1 on the same entry, every key distinct, PB27's R1 with it), saved and
    reopened, and every file the reopened board writes at its own door with the office's submittal taken; the file opened as
    a board; PB27 viewed; the shared folder's copy read and adopted (the first entry with each key) and a file handed over
    just after still refused; the sidecar through fetch and through the file:// branch; a package's list. A board opening
    with such a list: what it says; its package, the baselines' push and a PMO copy refused in literal words, nothing
    written and the ledger unmoved; a PMO copy built from it by this version's pmoCopyHtml (what 📤 Publish PMO copy would
    have written before it refused) and its office's submittal, refused in the words above; a PMO copy 7ee498a published from
    such a board (read by git show): it says nothing of the list, and its office's submittal is refused before and after Put
    it right (CONTROL: with dA only, held for review); Put it right (asked, then the list, R1, PB27 and every file it
    writes). It says so on all six openings (each line's own words first, the warning once; with the state
    file's answer held back, on the line from the start and once after the answer). Put it right is refused while a stopped
    full import holds saving (storage byte-identical, the hold on) and, answered No, writes nothing. A full import of a file
    carrying O&M only, into a browser holding Full Fund with "unassigned" in its plan and its locked cycles: the reopened
    board names both copies, publishes no PMO copy, and Put it right puts Full Fund right. The words around a repeated key
    (Goes to, the choices, the panel, ✕ on the repeat named apart or alike and kept on reopening, ✕ on the entry repeated,
    the menu's count); every OGC row and tab; one title on 1 and "1"; Depot Text offered beside the number 1; a repeated key
    adopted where the key was removed; the door on the rest of the rule; a board of the user's own holding an entry that is
    not one, one whose repeat of Alpha Depot's name has a kind and match terms of its own, one with R1's ultimate recipient
    on "unassigned", one whose older map and kind conflict name "unassigned", and one whose second appropriation (Full Fund)
    holds the same plan with PB27 locked on it too; the team's copy of 1 and "1" refused, "1" alone read. The record of a
    moved key: a full import of a file carrying O&M only while Full Fund, kept, still calls "unassigned" by its old name --
    Full Fund opened after it, and after Put it right, has R1 and PB27's R1 on the destination the board showed (Depot U2,
    one of that name, its workbook from the bytes), and ✕ on that destination is refused naming Full Fund; Put it right, then
    an older file of O&M imported; a file whose list holds both the old key and the record's; the number 1; a requirement
    on a key no list names, left on none, also while the import moves another key. A manager's board holding such a list: ⬆ Send my work back refused (nothing
    written, the package not marked sent, storage byte-identical), then, put right, written and taken by the consolidated
    board; ⬆ Send back refused (CONTROL: written from a clean board). The tests review's nine: a repeat of Alpha Depot with
    terms of its own, and with a kind of its own, each kept; Which awards to and the bulk setter's offer each key once; Put
    it right's question naming the plans' copies; Put it right refused while PB27 is on screen, the working plan's later
    note kept; a team's copy holding true beside "true" refused; this browser's Full Fund, as a package carries it, named and
    its package not written; and a GUARD, two requirements of one title on one destination printed there, never on the split
    row. The tests review's fourth round: the board's own saved file, carrying the record, imported whole into an empty browser and into
    one whose own record names another key (the file's record is read first); true and "destsplit", renamed on O&M, followed
    by a kept Full Fund; a kept copy's entry nothing points at, followed; a destination removed under the key it moved to
    staying removed (a GUARD); ⬆ Send my work back refused with no package loaded. Two boards 7ee498a left holding
    "unassigned" (read by git show), O&M package #1 out with R1 on it, each put right, and the manager's return taken by
    the consolidated board -- after it renamed Depot U "Depot U2" and without: R1 on Depot U2 (then Depot U), one Depot U*
    destination, nothing the merge asks saying it discards a destination, and the workbook from its bytes Depot U2 1,100,
    Not yet assigned 300, OGC 1,400; a destination removed on 7ee498a while a kept copy still listed it, staying removed
    after Put it right; a list that already uses "dunassigned" (Depot DU): Depot U takes another key, two destinations,
    the workbook Depot U 1,100, Depot DU 300; and K4 again with that list, so that only this browser's record names the key
    "unassigned" moved to: Full Fund's R1 on the older file's Depot U, one destination, Depot U 1,100, Depot DU 300. The fifth round:
    the same two boards with "destsplit", the number 1 and true, renamed after Put it right and not, and with "unassigned"
    renamed on 7ee498a before either was put right; a destination removed as "unassigned" -- on 7ee498a, or here before Put
    it right -- staying removed when the manager's return, put right, arrives (two GUARDs); a consolidated board put right
    (dA twice, R2 on Bravo Yard) issuing to a manager's board 7ee498a left with the same list, which loads it before Put it
    right, then is put right and sends its work back: R2 on Bravo Yard on both boards, the workbook Alpha Depot 1,100, Bravo
    Yard 300 (CONTROL: put right first), and the same with Bravo Yard removed and made again; two boards 7ee498a left holding
    dA twice, both put right or only the manager's, R2 put on Bravo Yard there and the consolidated board renaming it "Bravo
    Yard 2" (CONTROLs: no rename): R2 on Bravo Yard 2, one Bravo Yard* destination; "unassigned" with only the manager's put
    right and Depot U renamed "Depot U2" on the consolidated board (CONTROL: no rename): R1 on Depot U2, one Depot U*, nothing
    the merge asks naming a destination; and a consolidated board put right, Depot U renamed "Depot U2", issuing to a
    manager's board that loads before Put it right and then puts R2 on its Depot U: R1 and R2 on Depot U2, Depot U2 1,400
    (CONTROL: R2 left as it was); and the list also holding the text key "dunassigned", so that Full Fund's "unassigned"
    takes a key made at random when put right: Depot U, removed on 7ee498a, stays removed when Full Fund opens. The sixth
    round: two boards 7ee498a left holding dA three times (Alpha Depot, Bravo Yard, Charlie Yard), O&M package #1 out with R1
    on it: only the manager's put right, the third entry renamed "Charlie Dock 2" on the consolidated board or not -- R2 on
    the renamed entry, one of its name; the manager removing Bravo Yard in this version before each is put right, and the
    same the other way, the manager loading after and before its own Put it right -- R2 stays on Charlie Yard, the workbook
    Alpha Depot 1,100, Charlie Yard 300 (CONTROLs: no removal); Bravo Yard removed on 7ee498a by the manager -- R2 on Charlie
    Yard -- and by the consolidated user, only the manager's put right -- R2, on Bravo Yard there, comes back on Bravo Yard,
    never on Charlie Yard; the manager removing Charlie Yard, the second repeat, and the consolidated board, which took the
    manager's key for Bravo Yard, put right and issuing O&M #2 -- Charlie Yard stays removed on the manager's board (CONTROL:
    no removal); a repeat whose key of its own the list already uses (Depot C, "ddar1"), and the same where only Full Fund's
    copy of the list uses it, imported whole -- Full Fund's R2 on Depot C; a destination removed as "unassigned" coming back
    while the manager's return points R2 at it (a GUARD); R1's ultimate recipient on "unassigned" too; Full Fund holding the
    same plan, opened after the return; a package naming Alpha Depot by another key into a board still holding dA twice; and
    the list this browser keeps after the return. The seventh round: two boards 7ee498a left holding dA four times, the
    manager removing Bravo Yard, then Charlie Yard, each put right, R2 put on Delta Yard -- R2 on Delta Yard, the workbook
    Alpha Depot 1,100, Delta Yard 300 (CONTROL: no removal); ✕ on Bravo Yard answered No, Put it right in the same session,
    R2 on Bravo Yard -- nothing kept as removed, Bravo Yard 300; the manager removing Bravo Yard and not put right, loading
    O&M #2 from the consolidated board put right with R2 on Charlie Yard, then sending its work back -- R2 on Charlie Yard
    on both boards, Charlie Yard 300; and the consolidated user resetting the list while it holds dA three times, the
    manager put right sending its work back -- Bravo Yard and Charlie Yard stay removed, R1 on Alpha Depot, the workbook
    Alpha Depot 1,100, Not yet assigned 300. A GUARD checks
    that U40's destinations notice, where the board has it, never pairs two entries that share one key. The checks that pass
    on 7ee498a are each labelled: the fixtures, the CONTROLs (among them the files the put-right board writes, which the
    base door, having no list rule, also took), and the GUARDs.
  - **Mutations:** 125 `v200-u44-*` (`-cats-every-entry` … `-del-first-clears`, the first two rounds' 51, three of them on
    lines this round changed; and `-keep-shared-none`, `-keep-folder-none`, `-keep-twice`, `-keep-replaces`,
    `-fix-mix-lifts`, `-fix-saves-first`, `-say-own-only`, `-say-no-cycles`, `-block-pmo-open`, `-block-pkg-open`,
    `-block-push-open`, `-tail-submittal-false`, `-same-name-words`, and the tests review's `-own-same-by-name`,
    `-picks-by-text`, `-del-first-by-name`, `-own-end-stays`, `-opening-replaces`, `-del-repeat-unkept`,
    `-copy-not-text-read`; the tests review's third round `-same-ignores-terms`, `-same-ignores-kind`, `-end-picker-every`,
    `-awards-bulk-every`, `-own-plans-unsaid`, `-fix-in-view`, `-say-no-packages`, `-copy-number-only`,
    `-resolve-no-dedupe`; and `-moved-unrecorded`, `-moved-not-reused`, `-moved-file-only`, `-moved-both-read`,
    `-moved-seed-any`, `-moved-not-followed`, `-moved-use-unsaid`, `-block-return-open`, `-block-sendback-open`,
    `-own-say-no-return`; the tests review's fourth round `-moved-browser-only`, `-moved-browser-first`, `-movable-no-bool`,
    `-movable-no-split`, `-follow-used-only`, `-return-issued-only`, `-gone-moved-unread`; and `-own-key-random`, `-own-key-used`,
    `-gone-not-moved`; the tests review's fifth round `-own-key-none-only`, `-own-key-text-only`, `-own-key-by-name`,
    `-gone-shared-unread`; and `-name-repeat`, `-own-key-rep-random`, `-own-key-follow`, `-diff-raw-keys`; and
    `-rep-removed-unkept`, `-own-key-live-count`, `-rep-gone-key-placed`, `-rep-place-unheld`, `-rep-place-ungone`,
    `-own-gone-placed`; the tests review's sixth round `-rep-used-taken`, `-gone-shared-used`, `-diff-end-raw`,
    `-name-unique-only`, `-follow-keys-reserved`, `-follow-untouched`; the tests review's seventh round `-del-place-naive`,
    `-del-no-kept-on-no`, `-snap-place-naive`, `-snap-place-ungone`; and `-reset-rep-unkept`); each caught by the focused block
    (`-own-key-random` and `-own-key-used` take their find from the line that gives a key of its own as it now reads, and
    `-own-key-follow` from part (c)'s line as it now reads; each makes the same wrong change it made before).
  - **Not covered:** a board that already carries such a list is put right only when the user presses Put it right; until
    then it says so on every opening and hands out no PMO copy or package, but its saved file and one appropriation are
    still written, and a board of this version refuses either but through ⬅ Import a full board, which takes a whole board
    and puts its list right as it comes across. A PMO copy an ORBIT before this one published while its board held such a
    list runs that ORBIT's code: it says nothing of the list, and its office's submittal is refused, before and after Put it
    right -- the office learns only then, its changes stay in that copy, and are made again in a copy published after Put it
    right (reading that submittal's list as a package's is read would keep them, but departs from the rule that a file
    handed over with such a list is refused -- the lead's to decide). The record of a moved key travels with the list: a
    list that replaces this browser's whole (the shared state file's ⤓ load, a newer board file opened) carries it only if
    the board that wrote it made or took the move, and otherwise a kept copy naming the old key is read by its name, as a key
    that list does not hold is. Two boards whose lists each hold "unassigned" for a different destination (Depot U on one, Depot Z on
    another) give it one key, as they shared the key "unassigned" before: a full import or a package between them
    joins the two by it, as any key shared by two boards joins (the same on 7ee498a). An entry whose key of its own the
    list already uses, or removed, takes one made at random, which two boards do not share (and a reset of the list counts
    "dunassigned" among the keys removed, so an older copy put right after it takes one made at random): two such boards join
    that destination by its name only, and a rename on one of them then makes it again on the other. A repeat is named by
    its place among the entries with its key. A repeat removed on an older ORBIT left no record of its place (that ✕ marked
    the key itself removed): every repeat of that key then takes a key made at random when put right, and a board not yet
    put right reads no key of its own for one, so another board's entry for it is found by its name only -- and a board still
    holding it as a repeat adds that entry beside it as a destination of its own, two entries of one name, the money on the
    new one (nothing reads a repeat). A key removed for another reason that a repeat's place would take counts as a repeat
    removed (a list reset keeps each repeat it removes under its place, as ✕ does). Another appropriation's plan or locked cycles that kept a copy of the list from before a
    repeat was removed are put right with their places counted as the board's list counts them: that copy's later repeats
    can take keys that name other entries of the board's list, or none; no requirement can be on a repeat, so none moves,
    but the removed repeat can come back, with nothing on it, when that appropriation opens. Keys that differ only in case
    or in characters other than letters and digits (dA and da) share their key of its own, and the second to take it takes
    one made at random; two boards whose lists repeat one key with different entries, not one list, give them keys by
    place, as they gave all of them the one key before. A team's copy (the shared folder,
    the sidecar) whose "unassigned" entry this board holds by none of its keys or names takes a key made at random, not the
    one every board gives it. The funds-flow chart's
    picked destination (on screen only) is kept by its place in the list and can name another destination after ✕
    removes one; its title and rows read one bucket, so nothing it prints is false. On the destination axis the
    workbook still heads its section "BY WHAT THE MONEY BUYS" and lists each destination as "— the remainder —"
    under "HOW EACH OGC CATEGORY WAS DECIDED" (as on 7ee498a). A repeated entry's own match terms are not read while
    it repeats. The change journal is not re-pointed when an entry takes a key of its own: putting back an older value of
    "unassigned" afterwards puts back a key that no longer names Depot U (as no board re-points the journal when a key
    moves). Put it right asks in ⬅ Import a full board's own words ("Import everything from “this board as it stands” …").
    Locked-view refusals of destination edits are U10's; how U40's notice words two entries that share one key is U40's
    (the GUARD).
- **U44, the "what the money buys" categories — a category list that repeats a key prints that category's row once**
  (found by the U44 money review, 13 Oct). A board file whose categories held a key twice ("ops") passed the door, ⬅ Import
  one appropriation took it, and the Funds Flow workbook printed Program Operations & Support $1,400 twice beside an OGC total
  of $1,400. Now each key is one row -- the OGC rows, the panel's boxes and drill-down, and the tabs -- under the FIRST
  category with that key; money is still placed by the whole ladder, in order, so no requirement moves, and the workbook's
  ladder lists every rung as applied.
  - **What users may see:** a board whose categories repeat a key prints that row once, its OGC rows adding up to the OGC
    total, with one tab; nothing else changes.
  - **Test:** audit-recon "v2.00 (U44) — a “what the money buys” category list that repeats a key prints that category’s row
    once" (5 checks; 3 fail on 7ee498a): a ladder Software (Alpha), Engineering (Bravo), "Software again" (soft again,
    Charlie), Program Operations & Support; R1 "Charlie Support" 1,100 printed once under Software, R2 300 the remainder; the
    workbook from its bytes, the panel, the saved file opened; CONTROL the default ladder.
  - **Mutations:** `v200-u44-buys-rows-every-key`, `-buys-last-name`, `-buys-tabs-every-cat` (3); each caught.
  - **Not covered:** the door does not refuse a category list that repeats a key (it prints right now). The matching-rules
    panel's share column shows such a category's share on each of its rungs (on screen only, as on 7ee498a; the workbook
    prints the row once). The workbook's "HOW EACH OGC CATEGORY WAS DECIDED" lists a repeated rung by its own name
    ("Software again"), though no row has that name: its money is in the first rung's row (Software).
- **U40 — two destinations of one list whose names match stay two; a requirement never loses its destination** (the lead,
  13 Oct, 12:02 PM ET: a release blocker, data loss; built on Brad's "Don't wait for me. Let's keep pressing throughout to get
  this next version published." of 12 Oct). Two destinations are one when their names match, ignoring case and spaces, yet
  typing kept "ALPHA DEPOT" beside "Alpha Depot", each with its own requirements. Opened in a browser whose own destination
  list was newer (a second person's), the file's list was read into that one by name: its second entry matched the first,
  which the same reading had just added, and the two became one. R2's $300 moved to Alpha Depot in the year on screen, the
  next year, on both hops and in the locked cycle; the funds flow and its workbook put R1's $900 and R2's $300 on one sheet;
  the opening line said only that the file had opened; and a save kept the merge. The same reading ran for a list saved
  before v1.86 (in any browser), an appropriation taken from another file, a shared-folder load and a PMO submittal, and a
  map an older board kept could send both entries to one destination without reading a name at all. Now a typed name another
  destination has is refused and nothing changes. One reading never puts two entries of its list into one destination,
  through a kept map or by name, and a name is not trusted to choose where the list itself, or the board's, holds it twice,
  or where it names another entry of the same list: the entry keeps its own key. Where the newer list had deleted one of the
  two and the file's requirements still use it, it comes back once, under a new key, and where it came back is kept with the
  destination list (in its saved map of old keys, under a name no list can take), so every later reading -- the locked cycle
  and the next year, the file reopened before a save, the saved file opened in a fresh browser, another appropriation's plan --
  comes back to that same destination, renamed or not (the cases where it cannot are named below); and while another
  appropriation's plan still waits to be read onto it, Used by on that destination names the plan, so it is not removed, nor the
  list reset, from under it. A key the list holds twice is one destination, and is never named as two. The destinations
  panel and the opening line name the destinations kept apart, and list each merge a reading makes by name (v1.86 promised
  "each merge is listed"); what they write is text. Starting point: Codex's batch A3 proposal, adopted after review, with one
  more guard (a name may not choose a destination the same reading already gave another entry) and its wording changed. Eight
  rounds of independent review followed. After the first two, the notice and the refusal compare keys; a destination brought
  back comes back once, at every opening, not once per session (the second review found one more "ALPHA DEPOT", with an empty Funds Flow sheet
  and a $0 row, at each opening that could not see the first session); and twelve more checks pin the come-back at every opening,
  what the notice writes, and where it is said. The third found that a destination brought back for another
  appropriation's plan showed there as used by nobody ("—", and ✕ said "Nothing points at it"), so a person who took it for
  their own requirement, and named it, took that plan's $300 with it at the plan's next opening, with nothing said; it is now
  counted where it came back. Eight more checks pin the record (an array, two keys brought back), the notice's name rule and
  keys, and a list saved before v1.86. The fourth found that the record could hand a deleted key the key another entry of the
  same list carries -- a list holding it and, after it, the destination it came back as, which a board that never deleted it
  had taken in from a file: that destination's requirements moved onto one more of the same name and the deleted key's took
  their place, with nothing said, and the funds flow put R1's $900 under the other name. A destination the board holds that the record
  names, carried by the list being read, is now claimed for the entry that carries it before the list is read (a name could
  already never take it). Two more checks pin the count where the destinations panel's own Used
  by cell and the list reset read it, and for another appropriation's locked cycle. The fifth found that a key merged by name
  was not remembered: one the newer list had deleted, or had never held, merged into its own destination of that name. Once the
  board came to hold that name twice -- a pair kept apart, from a second file opened in the same browser -- the next opening of
  the same file, still unsaved, put that requirement on one more destination of the name in the plan and the next year, while
  the locked cycle, kept at the first opening, stayed on the first: $300 on two destinations between the working plan and PB27,
  with nothing said but one more destination named as kept apart, and a save kept it (the board before this change did not do
  it). Where such a key was read by name is now kept in the same record, unless the record already names a destination the
  board holds. Three more checks pin the fourth round's claim where a person meets it: at an opening, where the record is read
  from storage; whether or not the plan uses the key it came back under; and with two keys brought back.
  The sixth found the same split by another route. A key merged by name could later be carried by a second file's list apart
  from the destination it was merged into: a pair kept apart, as this change keeps it. That list made the key a destination of its
  own or, where the newer list had deleted it, brought it back on a new key. The next opening of the first file, still unsaved --
  or of its owner's newer one, whose list had changed -- then read the key there in the plan and the next year, while the locked
  cycle, kept at the first opening, stayed where the key was merged: $300 on two destinations between the working plan and PB27
  (in the funds flow, and in the working plan's Funds Flow workbook under "ALPHA DEPOT 2"), with nothing said but that the two
  are kept apart, "each keeps its own requirements and money"; a save kept it. The board before this change did not do it,
  because it merged the pair. Now, for the appropriation open (whose plan and locked cycles a reading re-points, the cycles kept
  at once), each key of its lists read by name into another destination is kept, and lands there again at a later reading of any
  of its lists -- not where that list carries the destination it was merged into, and not for a key a list holds twice (and it
  is listed as a merge by name only under the same name). Another appropriation's list, read for the names only, keeps nothing
  this way, so Used by, which reads the record, still names where that plan lands. The sixth round's tests review found that such a
  key, merged by name and then renamed by its owner ("Zulu Yard"), was read onto the destination it was merged into with nothing said -- the
  file's own name appeared nowhere, and the Funds Flow workbook put its $300 on "Alpha Depot". Following the rename instead would
  move the plan off its locked cycle again (the board before this change did that: plan on "Zulu Yard", PB27 on Alpha Depot). So
  the key stays with its locked cycle, and that reading is now said: a key read where an earlier reading put it -- what is kept
  by name, or the record of where it came back or was merged, for any appropriation's list -- under a name that differs from the
  one its list gives it now is listed in the panel and on opening, once each; the same for a key brought back whose file renamed
  it since. Three more checks pin the fifth round's record where a person meets it: beside a key brought back and renamed, for
  another appropriation's plan read here, and beside a record that names a destination since deleted.
  The seventh found the same split where the owner's new name is one the reader's board already holds ("Bravo Depot"), for a key
  merged by name or brought back: that name found the destination for the plan and the next year, while the locked cycle stayed
  where the first reading put it -- $300 on two destinations between the working plan and PB27, said only as a merge by name (the
  board before this change did the same and said nothing). The round's own probes found two more routes to it, each the same on the
  board before this change: another entry of the list, read first -- a placeholder its owner had since given the old name -- took
  that destination by name, whatever the key's new name; and a key brought back where its name was refused (the board held that
  name twice) was kept only by the record, which a name comes before. For the appropriation open, a key kept by name is now read
  where it was kept also where its name finds another destination; what is kept is held for its key before the list is read, so no
  other entry of the list takes that destination by name (that entry is kept apart on a key of its own, and said); and a key that
  lands where the record says it came back is kept the same way. Each such reading is said as above. Seven more checks pin it
  (one of them because that keeping hid an array record for the appropriation open: another appropriation's list still has only
  the record); two more pin what that line says (once for each appropriation and each name, every name and key as text, beside a merge by name,
  after the panel is drawn) and two keys kept for one destination, read together; and three more read the record, and the name
  branch's own keeping, where the new keeping does not stand in for them: two keys brought back for another appropriation's list, a key
  merged by name while its record names another destination, and what each entry of a list holding one key twice says.
  The eighth round's money review found the same split where the owner's newer file carries apart the destination the key was
  read onto (its owner took that destination in from a file of the reader's list): the list says the two are two destinations,
  so the key is not read onto it, and the plan and the next year follow the list while the locked cycle, kept at the first
  opening, stays where the first reading put it -- $300 on two destinations between the working plan and PB27, with nothing
  said, or said only as a merge by name, or as two destinations kept apart that "each keep their own requirements and money"
  (the board before this change did the same silently, or merged the two). Brad, 19 Oct, 5:26 AM ET: that split stays, as a
  named limit ("Not covered"), and the board now says it, in the panel and on opening: "Read apart from where an earlier
  reading put it: Zulu Yard [U40-Z, O&M] → Zulu Yard [U40-Z], not Alpha Depot [U40-C]. Where a locked cycle was read then, it
  keeps the earlier one; where the two are one destination, move the requirements by hand." (words only: nothing is placed
  differently). Two more checks pin it. The eighth round's tests review found that the seventh round's hold on what is kept by
  name was pinned only for a key the board never held (six of nine wrong versions passed, two of them splitting the $300); two
  more checks pin it where the board has since come to hold that key, and for a key the newer list deleted, brought back.
  U40 lands after U44 ("a destination list that repeats a key …", above), so this commit carries what the second of the two
  must. The board's four meetings with U44 are resolved by their text: U40's `destBackMap` beside U44's helpers, and U40's lines
  at the start of `destFold`'s loop beside U44's `once` and its snapshot of the list (both kept, U40's first); U40's held-key
  line before U44's lines in the v1.86 branch (U40's acts only where the board holds the key, U44's only where it does not); and
  `flowEntUseMap`'s `same`, which follows the key a full import moved first and then the record of where a deleted key came
  back (U44's own recipe line). U40's recipe for U44 keeps the keys the funds flow keeps for its own rows ("unassigned",
  "destsplit") out of the record of a key brought back, of a key merged by name and of what is kept by name, with U44's own
  adaptation of the block's two funds-flow bucket readings. And F1, found only with both in (L8 trial 3): a key U44 reads BY KEY
  -- the key a full import moved it to, or the key of its own another board's Put it right gave it -- was listed by U40 as
  "Merged by name (the same name, ignoring case and spaces): Depot U [dunassigned, Full Fund] → Depot U2 [unassigned]": two
  names, and no merge by name. Such a key names that destination, as a key the board holds does, so it is no longer listed
  (`destJoin`'s `byKey`; ledger U71). Nothing moves: every requirement lands where it did, and a real merge by name is listed
  word for word as before.
  Predates v2.00 (v1.86).
  - **What users may see:** a name another destination already has, typed into the destinations panel, is refused. The
    field keeps what was typed, marked in red, with a tooltip; the line reads "⚠ Destination name not changed. “ALPHA
    DEPOT” matches “Alpha Depot”, another destination on the list (names are compared ignoring case and spaces). This one
    keeps the name “Bravo Yard”; give it a name of its own. Nothing was changed." A board whose list holds two such names
    says so on opening, after its usual line, and in the destinations panel until one is renamed: "⚠ Destinations with
    matching names are kept apart: Alpha Depot [U40-A] · ALPHA DEPOT [U40-B]. Each keeps its own requirements and money;
    rename one so they can be told apart." (in brackets, each destination's key; a key the list holds twice is named once,
    and never as kept apart from itself). A merge by name, the v1.86 rule for one name on two lists, is listed in the panel
    and on opening: "Merged by name (the same name, ignoring case and spaces): RAYTHEON [x1, Full Fund] → Raytheon [d…]."
    Where a second person's list already has a destination of that name, the file's two are kept beside it and all three
    are named. A destination the newer list had deleted, still used by the file, comes back once, under a new key, and stays
    that destination at every later opening, renamed or not (except where a whole list that never saw it come back replaces
    this one, or a destination of its old name is added again: "Not covered"; and a list that carries it beside the one it came
    back as, below). A destination brought back for another appropriation's plan (deleted here, still used there)
    shows that appropriation under Used by ("Full Fund (2)"); ✕ answers "Bravo Depot is not removed. The list is shared by every
    appropriation, and requirements point at it on Full Fund (2). …" and the list reset names it among the destinations in use
    elsewhere -- v1.86's own words. Renaming it renames it for that plan too, as for any destination in use elsewhere.
    A list holding a deleted destination beside the one it came back as (another person's board, which never deleted it,
    took that one in from a file) keeps both as its file has them: that destination keeps its requirements, and the deleted
    one comes back on a key of its own, under its own name. That new one is then where the deleted destination came back: a
    plan of another appropriation still on it is counted there under Used by, and at that plan's next opening is read onto it
    by name, said as a merge by name ("Merged by name (the same name, ignoring case and spaces): Bravo Depot [U40-B, Full
    Fund] → Bravo Depot […]."); a rename made earlier for that plan no longer reaches it.
    A destination a file's key was merged into by name stays that key's destination at later openings of that appropriation's
    files -- the same file, or its owner's newer one -- even after the board has come to hold that name twice, or that key
    itself (a second file carrying it apart from the destination it was merged into: then the merge is listed again at that
    opening, and the two are named as kept apart); a file whose list carries both keeps them apart, and where a
    requirement of the plan then leaves the destination an earlier reading, with a locked cycle, put it on, that is listed in the
    panel and on opening, once each ("Read apart from where an earlier reading put it: … not Alpha Depot [U40-C]. Where a locked
    cycle was read then, it keeps the earlier one; where the two are one destination, move the requirements by hand."); while another
    appropriation's plan still waits to be read onto it, Used by on it names that plan, as for a destination brought back, and
    renaming it renames it for that plan too. A key read where an earlier reading put it -- merged by name, or brought back --
    under a name its file no longer gives that destination (its owner renamed it -- also to a name another destination has -- or this board renamed the destination) stays
    there, with its locked cycle, and is listed in the panel and on opening, once each, not as a merge by name: "Read where an
    earlier reading put it, under another name: Zulu Yard [U40-Z, O&M] → Alpha Depot [U40-C]. Where the two are not one
    destination, move the requirements by hand." Another entry of
    that file's list that now has the name the key was read under is kept apart on a key of its own, and the two are named as kept
    apart. The Funds Flow workbook gives each destination its own
    sheet ("Alpha Depot", "ALPHA DEPOT 2"), as it always did for two destinations. A key U44 reads by key (moved by a full import,
    or put right on another board) is not listed as merged by name.
  - **Test:** audit-import "v2.00 (U40) — two destinations of one list whose names match stay two, and each merge a reading
    makes by name is said" (146 checks: U40's 132, the three "(11)" beside U44 and F1's eleven "(12)"). Typing: two spellings, the panel's own field, and the correction. The file, with both
    hops, two years and a locked cycle: opened fresh, where a newer list holds Bravo Yard or an Alpha Depot of its own, and
    each saved there and reopened (destinations by name, the funds flow, the Funds Flow workbook read back, the panel, the
    opening line). A list saved before v1.86. An appropriation taken from the file, a shared-folder load, a PMO submittal and
    a full import. destFold read directly: a key of the same list, a name the board holds twice, an older board's map, a name
    a destination took on since, and one name on another list (merged, the same way twice, and listed). What the notice must
    not say (two unnamed placeholders, match terms, a seeded key read into itself) and must say (each list's merge, once per
    list, through a kept map too, and a key merged into a second destination); one key held twice (fresh, against a newer
    list, beside a real pair, re-spelled); a destination the newer list deleted, coming back once (both hops, every year and
    the locked cycle, the funds flow by name, the panel, saved and reopened, reopened in the same browser before a save twice,
    another appropriation's plan read, saved and opened again, a record that is not a map or is an array, both destinations of
    the pair deleted by the newer list, and destFold read directly); a key brought back for another appropriation's plan (Used
    by, and ✕ refused; the panel's own Used by cell and the list reset, and with two years and a locked cycle, each counted);
    a key brought back, read before the key it came back under (that key keeps its own requirements) -- read directly, and at an
    opening where the record is read from storage, whether or not the plan uses that key, and with two keys brought back; a key
    merged by name, read again after a second file brought a pair of that name (the plan, the next year and the locked cycle on
    one key), and after a second file made it a destination of its own, or brought it back on a new key -- reopened, and from
    its owner's newer file, whose list has changed, opened twice (the same); where its list carries apart the destination it was
    merged into (not read into it; read directly); into a destination renamed since (listed as read where an earlier reading put
    it, not as merged by name; read directly); renamed by its owner, with a locked cycle (one key, said in the panel and on
    opening); renamed by its owner to a name the board holds -- merged by name, brought back, and brought back where its name was
    refused -- and read after another entry of its list that now has the name it was merged under (the same; that entry kept
    apart) -- also where the board has since come to hold that key, and for a key the newer list deleted, brought back; held for its key, and not for a key the reading does not carry, and kept where the record says it came back (read
    directly); two keys kept for one destination, read together (read directly); a key merged by name, read from its owner's newer file
    whose list carries apart the destination it was merged into, under a new name and under a name the board holds (the plan
    follows the list, the locked cycle stays, and that is said); a record that is an array, and two keys brought
    back, for another appropriation's list at a later opening (read directly); a key merged by name while its record names
    another destination, read again after the board came to hold it (read directly); what each entry of a list holding one key
    twice says, read twice (read directly); through the record and through what is kept by name, under another name (said once each -- for each appropriation and each name -- every name and key as text, beside a merge by
    name and after the panel is drawn) and under the
    same name (not said; read directly); a key merged by name for another appropriation's plan, counted under Used by where it was
    merged, and still where that plan lands after a third list brought its key back elsewhere, and read when that plan opens
    after the board came to hold the name three times (Used by and both hops); a merge by name beside a key brought back and
    renamed (the renamed one keeps it), and beside a record naming a destination since deleted (replaced; read directly); a
    list that holds one key twice, read twice (read directly); a
    key brought back whose destination is then deleted, then read again from a PMO submittal; names that read like markup
    (the panel, the opening line, a merge), and keys that do (the panel, a merge); names that differ only in spaces; the
    opening line's own markup kept; the opening after a full import; "New destination" beside a placeholder; a list saved
    before v1.86 holding the pair, opened where a newer list has an Alpha Depot of its own, and one of its names read where the
    board holds that name twice. Dollars are typed: R1 $900, R2 $300, $1,200. 107 of U40's 132 fail on the board before the change
    and the 25 controls pass on both. The three v1.86 destination scenarios (48 checks) pass unchanged. Beside U44: three "(11)"
    checks (an "unassigned" entry never recorded as brought back, merged by name or kept by name) and F1's eleven "(12)" (a key
    read by key not listed, at a reading and at opening, after Put it right on another board and after a full import; a real
    merge by name still listed; five controls) -- F1's six that are not controls, and the round-8 money review's two, fail on
    this commit's board without their lines (int40's fin-u40-pre, 19 Oct: exactly those eight fail, the other 186 pass). On this commit's board the focused block passes 194/194 (U40's 146 and the 48 of the three v1.86 destination scenarios).
    Expected values changed (principle 6), both in U40's own block and both because beside U44 a list's repeat of a key is not
    read (`destFold`'s `once`): `tools/export-audit/audit-import.mjs:8733`, "(9) a list that holds one key twice, read twice":
    `{U40-A: U40-F}` both times → `{U40-A: U40-C}` both times (its first entry, Echo Yard, merged by name; the claim -- read the
    same way both times, nothing more made -- unchanged; U40's recipe for U44); `tools/export-audit/audit-import.mjs:8744`, "(9) a
    list that holds one key twice, read twice: what it says": "Merged by name (…): Echo Yard [U40-A, O&M] → Echo Yard [U40-C].
    Read where an earlier reading put it, under another name: Delta Pier [U40-A, O&M] → alpha  depot [U40-F]. Where the two
    are not one destination, move the requirements by hand." → "Merged by name (…): Echo Yard [U40-A, O&M] → Echo Yard
    [U40-C]." (U44's fix round 6: the repeat, Delta Pier, is not read, so nothing is said of it). No orbit-board check,
    fixture or expected value changes.
  - **Mutations:** `v200-u40-typed-duplicate-kept`, `-refusal-field-unmarked`, `-refusal-names-itself`,
    `-incoming-pair-merged`, `-ambiguous-local-first`, `-same-list-key-consumed`, `-map-collapse-followed`,
    `-name-into-taken`, `-claim-unrecorded`, `-merge-unlisted`, `-merge-from-slug`, `-apart-unsaid`,
    `-editor-notice-gone`, `-opening-unsaid`, `-opening-replaces`, `-terms-refused-as-name`, `-own-key-listed`,
    `-merge-listed-twice`, `-merge-other-list-dropped`, `-map-fallthrough-silent`, `-placeholders-apart`, `-own-key-taken`,
    `-apart-pairs-one-key`, `-apart-key-twice`, `-refusal-own-key`, `-comeback-per-reading`, `-comeback-unrecorded`,
    `-comeback-into-taken`, `-comeback-session-only`, `-comeback-not-kept`, `-apart-name-unescaped`,
    `-merged-name-unescaped`, `-opening-markup-lost`, `-comeback-deleted-followed`, `-claims-session-wide`,
    `-refusal-unnamed`, `-opening-after-import-unsaid`, `-join-before-guard`, `-merge-second-destination-unlisted`,
    `-comeback-record-unchecked`, `-backuse-uncounted`, `-comeback-record-array`, `-comeback-record-last-only`,
    `-apart-spaces-unmatched`, `-refusal-case-only`, `-apart-key-unescaped`, `-merged-key-unescaped`,
    `-incoming-pair-legacy-merged`, `-ambiguous-local-legacy-first`, `-comeback-takes-listed-key`,
    `-backuse-cycles-uncounted`, `-backuse-panel-reset-uncounted`, `-name-merge-unrecorded`,
    `-claim-before-load`, `-claim-used-only`, `-claim-first-only`, `-claim-every`, `-record-kept-first`, `-reread-held-key`,
    `-reread-record-first`, `-reread-unkept`, `-reread-every-appropriation`, `-reread-twice-held-key`, `-reread-per-list`,
    `-reread-forgets-others`, `-reread-into-listed`, `-merge-renamed-listed`, `-name-merge-replaces-comeback`,
    `-name-merge-own-only`, `-name-merge-stale-kept`, `-kept-unsaid`, `-kept-any-name`, `-kept-memory-only`,
    `-kept-record-only`, `-kept-twice`, `-kept-notice-unsaid`, `-kept-name-unescaped`, `-kept-name-first`,
    `-kept-once-for-all-appropriations`, `-kept-once-for-all-names`, `-kept-board-name-unescaped`, `-kept-key-unescaped`,
    `-kept-to-unescaped`, `-kept-only-without-merges`, `-reread-held-key-claimed`, `-kept-said-once`, `-kept-held-unclaimed`,
    `-kept-held-ignored`, `-kept-held-uncarried`, `-kept-held-last`, `-backkept-unkept`, `-backkept-new-only`, `-left-unsaid`, `-left-notice-unsaid`, `-kept-held-unheld-only` and `-kept-held-deleted-unheld`
    (96), each caught by the focused block on its fixer's or reviewer's own board (four of them only by checks the seventh
    round added for them); beside U44, `-back-reserved-key`, `-merge-reserved-key` and `-memory-reserved-key` (99), with the finds of
    `-name-merge-unrecorded` and `-reread-unkept` on the guarded lines and those of `-backuse-uncounted`, `-backuse-panel-reset-uncounted`
    and U44's `v200-u44-moved-use-unsaid` on the composed `same` line; F1's `v200-u71-bykey-listed`, `-bykey-ignored`,
    `-moved-key-listed`, `-own-key-listed` and `-name-merge-unlisted` (5). On this commit's board the 17 new or re-pointed entries were each run and each caught -- `-left-unsaid` 2 failing checks, `-left-notice-unsaid` 2, `-kept-held-unheld-only` 1, `-kept-held-deleted-unheld` 1, `-back-reserved-key` 1, `-merge-reserved-key` 2, `-memory-reserved-key` 1, F1's five 6, 6, 2, 4 and 12, `-backuse-uncounted` 6, `-backuse-panel-reset-uncounted` 1, `-name-merge-unrecorded` 3, `-reread-unkept` 1, and U44's `-moved-use-unsaid` 1 of U44's 274 (K2 GUARD); mcount 1,978 entries,
    each matching once (full-suite
    sensitivity runs in the final-tree queue).
  - **Not covered:** a later message replaces the opening line (the panel keeps the notice), and the opening line is not
    withdrawn when the pair is then renamed apart -- it stays until the next message, while the panel clears at once; on a
    board whose open appropriation has no plan of its own, the notice follows that board's "SHELL TEMPLATE … no data inside"
    line; a merge is listed for the session it was made in, not saved in the file, so after a save and reopen it is no longer
    said; two appropriations whose lists are identical (the same keys, and names equal ignoring case and spaces) share one
    remembered map, so the second one's merge follows the first's and is not listed again; a file already saved with the
    merge cannot be split again (its two entries are gone); boards before this one (v1.86 to v2.00 as it stood) still merge
    such a pair when they read it (they keep the record of where a key came back untouched, and do not read it); where such a
    board already merged a pair and stored its map, the readers that use the stored map without reading the list again (a PMO
    submittal from a copy published before v1.86, which carries no list; a locked-cycle store from before v1.86; the "in use
    elsewhere" count) still follow it -- the board's own requirement was already moved by that board; the record of where a
    key came back travels with its destination list, so where a whole list that never saw the come-back replaces this one (a
    second browser whose own list is newer, or a full import of such a file), the next reading of a plan still on the deleted
    key brings it back once more (names and money right; one more destination of that name, named as kept apart, with its own
    empty sheet and a $0 row in the Funds Flow workbook), and the same where one key was brought back twice apart -- in a PMO
    copy and on the board -- and the two meet at a submittal (by reading; not run); this holds for every destination brought
    back, not only one of a pair; a destination added again under
    the deleted key's own name after the one it came back as was renamed is where that plan's next reading goes, by name (the
    merge is said), while Used by still counts the renamed one and says nothing of that plan on the one re-added: a requirement
    put on it shares it with that plan's from the plan's next opening, said there as a merge by name (as on the board before
    this change);
    with three destinations
    of one name (a second person's own beside the file's pair) the Funds Flow summary sheet has two rows with the same label
    (the figures are right; the sheets are numbered); a list that holds one key twice is U44's (this change only makes sure
    such a key is never named as two destinations); a typed name of any length, untrimmed (the ledger's 5,000 characters); a
    locked cycle taken from a file (`cycTake`, or with an appropriation taken) keeps its keys as they were and is not read
    through a list: where this board deleted a destination the file's locked cycle still uses, that cycle names a key the
    board no longer holds, and in its view the requirement's money shows under "Not yet assigned" -- the same on the board
    before this change, with or without matching names (a ledger row of its own is proposed); the batch import of several
    boards (`importBoards`) is measured only outside the suite (a review's probe: the pair kept apart, both hops, both years,
    the funds flow and the workbook, and the come-back once with its record), by no check of its own; one deleted key carried under two names by two lists, where another entry
    of the second takes, by name, the destination the first brought it back as -- that key then comes back once more, and the
    record follows the last come-back (measured by a generated probe, by no check); a PMO submittal refused after its list is
    read ("Nothing was loaded.") has still added or merged destinations, and the panel lists those merges (v1.86's order: the
    list is read before the submittal is checked); the Funds Flow workbook numbers a second sheet of one name ("ALPHA DEPOT 2"),
    and that can match, ignoring case as Excel does, a destination named "Alpha Depot 2", whose own sheet is then "Alpha Depot
    2 2" -- the detail sheets do not name their destination (as on the board before this change; proposed as its own row); and
    a key merged by name for the appropriation open stays merged at its later readings even where its owner's newer file, with
    its own newer locked cycle, puts it on that key, which the board has since come to hold (the merge is listed again; the
    board before this change read it so too, having merged the pair) -- a person moves it by hand, and the next such file is
    read the same way again; a key merged by name, or brought back, and then renamed by its owner is not followed to its new
    name: it stays on the destination it was read onto, with its locked cycle, and that is said at each opening that reads it so
    -- a person moves it by hand (the board before this change put the plan on a destination of the new name, made for it or
    already there, and left the locked cycle on the first) -- except where this board has since deleted the destination it was read
    onto, or the list holds the key twice (U44), and then its name is read as v1.86 reads it; at a reopening, a key read again where its name is refused is not listed again as a merge (it
    was at the opening that made it); a key listed as read under another name stays listed for the session, as a merge does, after
    a person moves its requirements by hand or renames a destination, and names the destination as it was named at that reading
    (the key in brackets stays right); a key its list leaves unnamed is listed with an empty name; what is kept of a merge by name travels with the destination list, as the record does, so
    where a whole list that never saw the merge replaces this one (a second browser whose own list is newer, a full import of
    such a file), the next reading is made afresh (by reading; not run); NAMED LIMIT (Brad, 19 Oct, 5:26 AM ET; the eighth
    round's money review, M1-CA): a key merged by name, or brought back, whose owner's newer file carries apart the destination
    it was read onto (the owner renamed it and took that destination in from a file of the reader's list) is read where that
    list puts it in the plan and the next year, while its locked cycle, re-pointed at the first opening, stays on the earlier
    destination -- on that route the working plan and the locked PB27 can sit on two destinations, and the board says so ("Read
    apart from where an earlier reading put it …"); a person moves the requirements by hand (the board before this change did
    the same with nothing said, or merged the pair); that line is said in the session that reads it so, and where the key then
    merged by name, a save removes it from the list and later openings do not say it again (as for a merge); beside U44, a key a
    list holds twice is read at its first entry only, so its repeat is not said; F1 tells a reading by key apart by the board not
    holding the key at the held-key join, which only U44's two routes reach (by reading); U44's part (c) is not followed by
    `flowEntUseMap`'s `same`: on O&M, Used by on Depot U2 is blank for a Full Fund file put right on another board, ✕ removes
    Depot U2 asking only "Remove Depot U2?", and Full Fund's R1 comes back on a re-made "Depot U" (no money is lost; the same
    without U40; not fixed here, ledger U72); and Chromium, and two real machines.
- **UI menu — every top-right menu moves into the left menu, each action in one place; and the nine Section 508 / WCAG
  2.2 AA findings from the UI branch closed** (Brad, 19 Oct 2026: "Move every top-right menu into the left menu, and
  remove every duplicate, so each action has exactly one home." Built on branch `menu` from `b71b18e`, the head of PR #13:
  `439716b` the menu (board `ffe86c20`), then the 508 fixes (board `e120dde0`), the commit after it.)
  - **What changes:** the left menu holds what 💾 Save, Reports & exports ▾, Data ▾, Setup ▾ and 📁 File ▾ held, each item
    by the call its menu item made (`mRun(...)`): **Reports & exports** is a box with its six groups side by side and Find
    on top; under Board, **Imports & exports** (the Import box renamed: a whole board or one appropriation, in or out),
    **Data** (a box, a card for each source saying what it is and when it was last loaded), **Program offices** (Publish
    PMO copy, Review submittals, and the submittal loading the Import box's PMO Import card did; not shown in a PMO copy,
    as File left its group out), **Audit** (the change journal, the save history, the pen and your name), **History &
    recovery** (earlier copies and work kept aside only) and **Setup** (its own flyout, folded as before, with Live view
    and Save diagnostics). **💾 Save is pinned at the foot**, where the ORBIT line was, with the save state, who holds the
    pen and a ▾ for Save a copy; folded to icons it is an icon with a dot for unsaved work; **Ctrl+S saves** (the
    button's call; b71b18e had no Ctrl+S); in a PMO copy the spot is ✉ Submit input, and Save and Save a copy stay under
    ▾, off, as File said. FYDP ▸ and Execution ▸ keep only their views (FYDP Spend Plan (Excel) to Reports & exports,
    Import CCaR QPE to Data, the links to the top menus gone). The top keeps Appropriation, Fiscal year, PMO, search,
    Filter, the message line and Help; the toolbar's Import, a second way to the box, is gone. Every help text and
    message that named an old menu path names the new one ("Put your name in first — Audit › ✎ My editor name…"); no
    "File ▾" is left in the board. The inventory, old place → new place for all 99 items, is
    `$SP/rec/L8/menu/INVENTORY.md`.
  - **One home each, and the three reached two ways on purpose:** a view lives in its section's flyout (FYDP ▸,
    Execution ▸) and nowhere else, so Reports & exports no longer lists the forecast, CR Cash Needs, the five-year plan,
    PPBE Budget Positions, Spruills, Active Year Execution, Reprogramming Actions or the Funds Flow, and Data no longer
    lists QPE coverage or ORBIT vs CCaR: the section or card each sat in says where it is, and Find finds that line.
    Save is the button and Ctrl+S; Live view is Setup › 📡 Live view and History & recovery › ↶ Earlier copies (the lead's
    target names both); work kept aside is History & recovery's and the save state's own "↶ work kept aside", as before.
    The mode tools in the task bar (Brief's PowerPoint deck and Exec synopsis, Fund's Executive decision and Bands) are
    left as they were: Brad's call.
  - **Found and fixed on the way:** an item in FYDP ▸ or Execution ▸ closed its flyout and left the keyboard on
    nothing, so the box it opened gave the keyboard back to the top of the page; every left-menu item now closes its
    flyout or box first and gives the keyboard to its entry (dialogs-keyboard caught it once those boxes were opened from
    there). A flyout closes when the keyboard leaves it, as a toolbar menu does. The status line, hidden, is laid out at
    the bar's left edge: with only Help beside it, its out-of-sight words reached past a 761-1023 px window (layout-fits J).
  - **508 (the commit after `439716b`, board `e120dde0`):** `npm run standards` found nine at `b71b18e` and finds none now; `tools/a11y-baseline.json` is
    unchanged (0). 1.4.11 ×5: the RECORD panel's ✕ Close had a `--line` edge (1.36–1.60:1), and takes `--edge`, as every
    box's ✕ Close has since v1.96. 2.5.8 ×2: that ✕ Close (59×20 px) and the fold control (17×24 px) are 24 px at the
    least. 2.4.7: the left-menu entry for the section on screen showed no focus; every entry takes an accent ring. 1.4.10:
    the 18 px of sideways scroll at 320 px went with the menu change (Save and File left the top bar). The left menu's
    boxes, flyouts, folded state and unsaved Save are measured too, and added no finding (the pinned Save's edge against
    the navy was the one, fixed in `439716b`).
  - **What users may see:** the left menu as above, and nothing at the top right but the message line and Help. The
    figures, exports and saved files are those of the board before.
  - **Test:** `tools/left-menu.mjs` (new; `npm run leftmenu`, last in `verify:grid`; Chromium, the empty template, and a
    PMO copy published from synthetic requirements; every expected value a hand-written literal): (A) each of the 69
    calls the old menus made is reached from the left menu as often as the inventory says, and nothing else is; (B)
    Ctrl+S; (C) the five controls are gone and the kept ones stay; (D) a PMO copy; (E) folded and from the keyboard
    alone. 23 checks pass on both boards (`ffe86c20`, `e120dde0`); 13 fail on `b71b18e`.
  - **Existing checks changed, each to test the same property at the new place:** menus (`menu-paths.mjs`: a path names
    the left-menu entry and is read from its list; sections are groups), keys (`keyboard-reach.mjs`: G names the menus
    that stay; G2's Find in the box; new G3, the seven flyouts held to G and G2; L and K from Help and Setup), dropdowns
    (the ten flyouts and boxes, Setup's groups each open), dialogs (boxes opened from the left menu by keyboard: 37 of 46
    against 15 of 44 at `b71b18e`; the three left-menu boxes give the keyboard back 20 of 20), panels (the two new boxes,
    and the seven flyouts held to a menu's checks), toolbar-fits (the controls that moved are counted where they went;
    every left-menu control is held to on screen, whole and clickable), layout-fits (B finds the left menu a home),
    standards (the left menu measured open, as the toolbar menus were), ia:census (the left menu's lists read as menus),
    audit-board (v1.96 item 65's scenario), audit-import (v1.84 and v1.86's File scenarios, the put-back scenarios'
    `fileMenu()` and `menuText()`), audit-recon (three messages and one help paragraph), audit-ui (two messages) and
    `tools/export-audit/hostile.mjs` (the hostile-text sweep shared by audit-hostile and `npm run hostile`: the left menu's
    three boxes and seven flyouts, Setup's groups each open, are drawn and read as the menus were).
    `tools/row-controls.json` did not need a change. Nothing was deleted or loosened.
  - **Mutations:** seven entries re-pointed, each against the same behaviour (`menu-wbs-not-in-data`, `menu-find-kept`,
    `menu-copy-offices`, `restore-keep-refusal-ignored`, `v200-u10-shared-gate-in-adopt`, `v200-cycreg-advice-unwarned`,
    `v200-cycreg-help-refusal-unsaid`); mcount: 2,015 entries, each once.
  - **Brad's answers (19 Oct, 12:25 PM ET):** views keep one home each, as built. The task bar's repeats go: Fund's Bands
    and Executive decision, Brief's PowerPoint deck and Exec synopsis, and the same four in the folded Tools ▾; each keeps
    only its left-menu home (no other task-bar button repeated a menu item). `tools/left-menu.mjs` F holds it (fails on
    the board before). AGENTS.md's long-menu rule names the left menu's folded groups and sections, and a new rule holds
    one home for each action; CLAUDE.md has "Where every action lives", the map the version sections are read through.
  - **The two carried limits:** toolbar-fits at 1152 px now PASSES in review and fund (the context bar is one line, 44 px:
    Save and File left it). layout-fits D still fails the same eight checks; at 1024×768 the first row is at 420 px, not
    453 px.
- **Unresolved after R1–R5 (11 Oct).** These are known and not fixed. Each waits for Brad's decision; the full list is in
  `recovery/v200/UNRESOLVED-LEDGER.md` on the backup branch.
  - **U1: built as its own commit** (Brad, 12 Oct, 6:11 AM ET: "Proceed with U1 as its own commit, followed by U14
    separately"): a row carried into a year neither imported nor planned is offered and counted (above). The board's own
    plan for that year is counted beside it, also where another appropriation's row opens the year (FY26 × {O&M, Initial
    Spares} = $400M). The independent arithmetic and the saved-selection controls are committed checks.
  - **U2: complete** (accepted by Brad, 12 Oct): the change count (U2 1 of 2) and the refusal while a save is under way
    (2 of 2) are both above. audit-import passes at both commits, and each new mutation is caught, in runs made alone.
    Its separate reopening and adoption findings stay open in the ledger (U15–U17); U18, U19 and U20 are built (below; U18
    except a copy landing during the write itself).
  - **U3: built as its own commit** (the lead's decision under Brad's "keep pressing", 12 Oct): a Save, Take the pen,
    ⬆ Publish now, Save yours over theirs, Load theirs or the autosave asked for under the mixed-import hold is refused at
    once, also behind a save under way, and allowing saving again does not bring it back (above). Not covered: a save
    asked for before the hold and still waiting when saving is allowed again runs and writes, as the question warns.
  - **U4: built as its own commit after U3** (the same decision): the folder save checks the hold again after its read
    and after its history copy, just before its write, and Save yours over theirs / Load theirs after their read and
    after keeping theirs (above). Not covered: the write itself, and the board file's own write after R4's check.
  - **U18: built as its own commit after U56 and U57** (the lead's decision under Brad's word of 12 Oct, about 5:30 PM ET, to keep
    pressing): a copy another writer saves while a folder save is under way is no longer written over -- the save reads
    the folder's copy again just before it writes and stops on any difference, and U4's hold is checked after that read
    (and said, when it and a landed copy come together) -- except one that lands during the write itself (above).
  - **U61: built as its own commit** (the round-8 money review of track cycreg, its SF2; Brad, 18 Oct, about 5:00 PM ET: "Fix
    now, don't hold"). An RCN / EEIC pointer of "__proto__" no longer loses or doubles money in the ACE alignment lines or the
    tie-out's Alignment Breakout: the line carries all of its money once and reads as not assigned (above). Keys the import door
    refuses can still arrive in a file opened directly (item 99's limit): an office so named in another appropriation's year
    stops the Spruills table (read in code). The sweep's list is in the track's README.
  - **U5 and U6:** R3's stale on-screen flag, and its quiet-autosave wording.
  - **U7:** R2's checked and stored expressions are written twice.
  - **U8:** R1's Help and wording remainders.
  - **U9 (P2): PMO split disagreement.** At $3 split 1:2:3, the PMO parts, the forecast and the PMO Matrix export give
    $0/$1/$2 where exact largest-remainder arithmetic and the CLIN source workbook give $1/$1/$1.
  - **U10 (P2): built as twelve commits** (a release blocker, fixed on Brad's word of 12 Oct, "keep pressing"): a refusal in
    a locked view makes the view's copy again, whole (U10 1 of 12; with it ledger U49, the funds flow's partner and FMS money
    and its year buttons, read by 5 of 12, its appropriation buttons, pseudo year, prime rules and categories, read by 9 of 12,
    and where its unfunded priority list goes, read by 10 of 12); the imports and the destination list, which every
    appropriation shares, are refused in a view before anything is kept (2 of 12); so are the Spend Plan's choices (3 of 12),
    and Import one appropriation, the ladder copy, the package doors, the shared state file and the shared folder's refresh,
    with Import one appropriation and the three workbook imports refused again once their file is read (4 of 12; Import full
    board is refused before its file is read only); Load theirs and
    Save yours over theirs once the shared folder is read, each in its own words (6 and 8 of 12), and Save yours over theirs
    in a save's words at its other two gates (11 of 12); and the change journal's ↶ Put back, which re-took the journal's
    record from the cycle before its save was refused, and "↶ work kept aside", which asked a question about the cycle and
    wrote it into the kept slot before it was refused, are refused up front (7 and 12 of 12). Neighbouring cases stay open in
    the ledger: edits a view allows and keeps (U51), a locked cycle's offices (U52), its funds-flow money (U53), the
    "Not kept" mark that a slow redraw can outlast (U54), and the funds-flow export's words about the unfunded list
    (U55, not U10's).
  - Both U9 and U10 were reproduced in the review of `main` `f9b4413` and on `e635775`, and again here on the current
    tree (`4a6f7c7`) with bounded synthetic probes.
  - **U13: built as its own commit** (selected by Brad, 12 Oct, 6:00 AM ET): a refresh during a save loads nothing,
    checked after its last wait (above). Its separate reopening and adoption findings stay open in the ledger (U16, U17;
    U18 and U20 are built, below; U18 except a copy landing during the write itself), with those found while building and reviewing it (U21–U27): a false clash in a save's last
    window; ↻ Refresh now's words; Live view's "Loaded" time; three other adoption paths that do not wait for a save
    (unverified); a save that starts and ends during a refresh's read; status lines left false after an autosave; older
    refusals that say nothing was loaded or replaced while the same Connect loads execution data.
  - **U14: built as its own commit after U1** (decided by Brad, 12 Oct, 6:00 AM ET): ALL YEARS holds every plan the board
    holds, and nothing is made to offer a year; a saved year selection the board cannot answer for is kept, not counted,
    and said on the panel and in the export; the label names only years in the total (above). Three questions stay with
    Brad: whether the `rlgIsUpl` line belongs in this commit, partner and FMS type-ins in a year no longer offered, and
    what "genuine stored plans" takes in (a roll-forward outside the window; a blank year left by a Cancel).
  - **U32, U33 and U50: built as one commit** (Codex's review of `main`, as Brad supplied it, 12 Oct, about 6:05 PM ET; Codex
    batch B2, 13 Oct, P2): an RCN / EEIC list that repeats a key, or holds "__none__" or a key that is not text, never counts
    money twice; a file handed over with one is refused in true words, and the user's own board comes across saying what it
    holds (above). Deferred by Brad (13 Oct, about 8:30 PM ET): a locked cycle's list stays as it was locked, and a way to
    correct one is not built -- so while a board holds a locked cycle whose list breaks the rule (a lock made on this version
    while the working plan's list breaks it says so first), its saved file and its
    one-appropriation file are refused by ⬅ Import one appropriation and ⇊ Import several boards on every board of this
    version, its own included, and the refusal says so -- naming that cycle even when the file's working plan's list is
    refused first -- as does ⬇ Export one appropriation when it writes such a file, and the help; the file opens as a
    board, and ⬅ Import a full board takes it whole (replacing the taking board's BAE list and execution data). Its package
    and its PMO copy pass while its working plan's list keeps the rule (✕ on a repeated row there, or on an entry such as
    "K9", puts it right, as their refusal says). Still open: a board whose working plan's list holds a null entry cannot
    export or show its RCN / EEIC panel, as before, and nothing puts it right, as its file's refusal says by naming no way,
    alone or among several files; one whose working plan's list holds 0, false or "" (taken whole from a file) cannot send
    its package, PMO copy or state file, as ✕ on that row does nothing, and their refusal names no way.
  - **U19: built as its own commit after U18** (the lead's decision under Brad's "Don't wait for me", 12 Oct, about 5:30 PM ET):
    ↶ Put back keeps what is on screen aside in the kept work's place, saved or not and whoever saved it, unless 💾 Save
    writes to the shared folder at the put-back and what is on screen is the folder's own copy. So 💾 Save's HOLD ON answered
    OK no longer leaves the work that was on screen at the put-back in no copy this board can reach, whichever way 📡 Live
    view's switch is set by the Save (above). While work is kept aside, the HOLD ON's Cancel advice names ⬅ Import, not a
    reopen. Open, for the lead or Brad to accept knowingly: the board keeps one copy aside, and every ↶ Put back in the
    board file now fills it with the copy it replaced. While that copy is kept, a newer copy saved into the file afterwards
    -- from another browser or by a colleague, with or without a Save since the put-back -- is not loaded over new work on a
    reopen (the board says so), and the next 💾 Save's HOLD ON answered OK leaves that newer copy only in Teams version
    history. On the board before, the route with a Save after the put-back lost the copy the put-back replaced instead; with
    no Save after it, the board before loaded the newer copy and kept the new work (measured: verify-money-r2 W4,
    verify-money-r3 Y2). Open, and not U19's: the shared folder's own "Put this back" (🕓 Show what the folder kept) over
    work saved only in the board file keeps nothing, and the next 💾 Save to the file writes over that work without asking
    (ledger U64); and the same for a Live view refresh that loads a folder copy over such work (ledger U63). Open, as
    wording points for Brad: the HOLD ON's "their changes" for the person's own save (O1); the put-back status naming the
    earlier writer after a take-the-pen route; the "newer copy was not loaded" message naming S1 twice on a reopen before
    any Save; the put-back question naming the place by the kind of the kept copy for work kept by an opening or by Load
    theirs; the HOLD ON's Cancel line still naming a reopen on the classic route, where this browser's own copy is the newer
    one; and the top bar's "Unsaved changes" after a saved copy is put back. The top bar's "Saved" on a reopen while the work
    on screen is unsaved by the record is the board's existing opening behaviour (U15).
  - **U20: built as its own commit** (the lead's decision under Brad's word of 12 Oct, about 5:30 PM ET, to keep pressing):
    a save, or Load theirs, waiting for another tab's Web Lock is counted as under way from the moment it is asked for,
    until it ends (above). U2's refusal and U13's two guards now see it.
  - **U30: built as its own commit after U20** (the same decision): a refresh records the folder's copy as the one the
    work came from only when it is what is on screen; otherwise Save asks, and with nothing recorded nothing on that route
    says theirs came after, or is newer (above). In this case no copy is written over unasked, and none is left only as a
    recent history copy. U29 (another copy put on screen, then Save; the ADOPT track) is a separate finding.
  - **U34: built as one commit, its build and both fix rounds together, as its builder recommended** (Codex's review, as Brad
    supplied it, 12 Oct: "the malformed saved-year selection"): a saved year selection the board did not write is read as
    no year, kept as saved, and said on the panel and in the export; it is never read as ALL YEARS or as a year it does not
    name, and its quote keeps the exported workbook well-formed (above). Its limits are under "Not covered": a whole number
    that is no plausible year, an enormous list of distinct whole numbers, "kept" meaning the same value rather than the
    same bytes (1e999 is written back as null); a whole saved value of 1e999 read as ALL YEARS with nothing said; a saved
    NaN that makes the file's whole saved state unreadable, with the warning replaced on the status line in the same
    opening (U47); a saved year a century off an offered year printed as that year (U48); a selection nested
    too deep for the board to open; and two findings recorded on their own: the saved appropriation selection, which still
    reads a malformed value as all appropriations with nothing said and counts money from appropriations the file does
    not name (U45), and saved prime-match text or category names holding U+FFFF, which now refuse the funds-flow export,
    naming the cell (U46, closed by U37's commit).
  - **The registry-text review** (first filed as U35 while Codex's text had not reached the lead). Checked on `d66dd60`:
    typed, in a file opened, saved and reopened, and through Import a full board; and on the screen, in the workbooks and
    the slide deck read from their bytes, and in the saved file. Not followed: a cycle file, a PMO copy or submittal, a
    package, a service file, a PDF, and Excel or PowerPoint themselves. **U36 is fixed above:** a typed RCN / EEIC title over
    80 characters is refused, not cut. The rest stay open, with their limits stated above under U36's "Not covered":
    - **U37: fixed by its own commit** (above): a character XML 1.0 forbids, in any text, refuses the workbook, the deck or
      the chart image before a byte, naming the sheet and cell, the slide and its text, or the chart's text; a band colour a
      board file carried that is not six hex digits refuses the Priority drill, naming the band, and every other band whose
      colour is refused, and saying that a band's colour has no field on the board and what can be done, with what each way
      costs (in a locked cycle's view, which keeps nothing done in it, where to do it); a workbook also refuses a literal
      `_xHHHH_`, naming the character a spreadsheet reads it as. The refusal leaves the status line when a workbook is next
      made, and says that a locked cycle keeps the text it was locked with. Left as they were, and said above: half of an
      emoji (the board's own cuts make one; the encoder writes U+FFFD, which XML allows); a carriage return in a cell, and a
      TAB or line break in a sheet name, which XML allows; a literal `_xHHHH_` in imported text, refused in
      a workbook as a named limit (Brad, 19 Oct: the export names the cell, the user corrects the source and imports again;
      decoding such codes at import goes to the post-merge list); Excel and PowerPoint themselves were not run.
    - **U40: built as its own commit** (the lead, 13 Oct, 12:02 PM ET: a release blocker, data loss): two destinations of
      one list whose names match, typed side by side, stay two wherever the list is read in -- opened against a newer list,
      before v1.86, an appropriation taken from a file, the shared folder, a PMO submittal -- and a typed name another
      destination has is refused; the destinations kept apart, and each merge a reading makes by name, are said on the
      panel and on opening; a destination the newer list deleted comes back once and stays that one at every later opening,
      while another appropriation's plan still waits to be read onto it Used by names that plan and it is not removed, and a
      list that carries it beside the one it came back as keeps both (above); a key merged by name stays merged at later
      openings of that appropriation's files, with its locked cycle, even where a second file then carries it apart, and where
      its owner has renamed it, to any name (that is said); so does a key brought back. A file already saved with the merge cannot be split again; boards before this one still merge such a
      pair;
      where a whole list that never saw the come-back replaces the one that did, the next reading brings it back once more
      (names and money right). Named limit (Brad, 19 Oct): where its owner's newer file carries apart the destination a key
      was read onto, the working plan follows the list while the locked cycle stays -- said on the board ("Read apart from where
      an earlier reading put it").
    - **U41: fixed above** (its own commit): the code is kept as saved, listed in Needs attention and Pre-flight, its money
      counted under no recognized code, never the derived one, and chosen again in the Navy SI code field. **U56 and U57
      (Codex's C1b) are fixed above** in one commit (Codex's C5): a saved value that is not text, such as [] or
      {"toString":null}, is counted in a bulk write's question as an answer it overwrites, and Go to it opens its field.
      **U58 and U59 (the money review of U56/U57) are fixed above** in one commit: the change journal and the PMO
      submittal review, in its panel and its workbook, show such a value as saved, by its JSON, and draw where they threw.
      Still open from that review: Put back of a write over a saved bare null deletes the key (the journal records the
      null as "not set"), so the requirement reads its derived code again.
    - **U42: the sheet name fixed above** (its own commit): a funds-flow sheet name no longer ends in half an emoji or
      begins or ends with an apostrophe. Still open: the slide deck's 56-unit cut of a requirement title can split an emoji
      the same way (a replacement mark in the slide).
    - **U38 (P2 proposed for the Spend Plan Source, P3 on the board).** A file keeps RCN / EEIC text that typing would refuse
      or change, and the Spend Plan Source prints it as stored (padded, lower case) with nothing flagging it.
    - **U39 (P3).** Two entries with the same text print identical rows.
    - **U35 (P2, deferred by the lead; Codex's A1).** During a Live refresh, typing not yet committed in the RCN / EEIC
      dialog is replaced by the stored value without a question.
  - **U44: built as two commits** (a release blocker by the lead's decision, 13 Oct; found by the lead's integration dry
    run): a destination list that repeats a key, or holds "unassigned" / "destsplit", a key that is not text or an entry
    that is not one, is refused at the door in a file handed over; the user's own board taken whole is put right as it comes
    across, each such key, and each repeat (by its place, counting the repeats removed), taking the same key of its own on every
    board, a board not yet put right reading that
    key as its own entry, and a copy it did not carry following each key it moved (a destination removed here, by ✕ or by a list reset, stays removed); a board that carries such a list in any copy says so on
    every opening and in 📍 Destinations, hands out no PMO copy or package (a return included), and offers Put it right; a
    team's copy holding a key that is not text is refused; the funds flow and its
    workbook count each key once, under the entry the board reads, never under their own rows; a "what the money buys"
    category list that repeats a key prints its row once (above). Open: such a board is put right only when the user presses
    Put it right; a PMO copy an ORBIT before this one published from such a board says nothing of it, and its office's
    submittal cannot be taken (the office redoes its changes in a new copy) unless the lead decides to read it.
  - **UI chunks 1–3 and UI-C1: in this version** (Brad, 18 Oct): the new layout, presentation only (above). Carried as
    named limits by Brad's decision (18 Oct): toolbar-fits' one-line rule fails at a 1152 px window beside the open
    sidebar (every control on screen, whole and clickable), and layout-fits D fails at four sizes, sliding over and
    docked (the first requirement row starts at 323 px against 320 px; 453 px at 1024×768). The chunk-2 review's minors
    stay open (ledger UI-m1…m7).

### v1.99 — 6 Oct 2026: items 85–98, built on Brad's "go" and his scope of 6 Oct -- the 6 October review of v1.98

**The review's four, and the nine Brad scoped beside them.** An independent engineering review of v1.98 (6 Oct)
confirmed the 5 Oct review's ten closed and the money map at 0 open, and found four more (85–88); each was confirmed again
on v1.98 before it was logged, and each is fixed. Brad then scoped nine more from the open notes (90–98): whole-number
quantities, codes refused rather than cut, the funds-flow export's scope and its executed years, the ACE reconciliation's
estimate-only offices, side lists that stay unsaved across a reload, an estimate's earlier copies, and two pieces of
wording. Every item has checks that fail on v1.98, and mutations that remove each fix.

**What users may see:** no total changes on a board whose figures were valid. Where a split is worked out again a dollar
on an exact tie can move to the lower service (item 85). A quantity or a code that was taken loosely before is refused
now, and one already saved that is not valid is kept and listed under Needs attention (items 90, 91). ⬇ Export funds flow
writes the panel's selection, and a year can be planned for one appropriation and executed for another (92, 93). The ACE
tie-out's PMO block gains rows for offices with only estimate lines, and its TOTAL moves by their estimate (94). A board
reopened with lists the file does not have reads Unsaved changes, and says which (95).

**Expected changes to existing checks (fixtures kept, expectations changed):** the v1.97 funds-flow tests set the panel's
selection (`flowCfg().fys`) where they set `flowFy`; the v1.97 ACE tie-out test checks the new accounted-for line apart
from the office rows; the full-import version test's pattern reads any major version and is checked to have replaced the
stamp.

**The final check** passed on the candidate tree (`5942e58`, board blob `b160bc0`), 7 Oct 2026. Four six-hour runs of
`npm run validate:math` were each ended by a container restart, so the gate was run as a restart-proof batch runner — the
same nine stages, the same commands, the same pass rules, with every stage and every sweep batch saved as it finished and
the sweep split into twelve batches. It ran 5:09 am – 2:58 pm Eastern on one uninterrupted container, every stage clean —
the defect register (13 defects, 43 mutations), money coverage (26 of 26 surfaces), the money map (329 cells: 123 proven,
206 not applicable, 0 open), the trace matrix (92 cells), all eight suites, every browser check, the fuzz (seed 721033589)
and the file verifier — and **all 1,128 planted mistakes caught** across the twelve batches (11 more change nothing by
design), 0 survived, 0 not applied, 0 crashed, and 0 disagreeing between batches: v1.98's 1,069 plus 59 new, all presweept
first. Independent expected-versus-actual on the candidate board: 23 comparisons, 0 differences. The candidate's code and
tests are byte-identical to what the gate tested; only this line and its twin in CLAUDE.md were written in afterwards.

#### Scope (Brad, 6 Oct 2026)
- **In v1.99:** items 85–88 (built), and 90–98 below. This approves the engineering direction; it does not certify the
  branch or authorise publishing.
- **The original regression fixtures are kept.** Where a fixed behaviour changes what an existing check expects (the
  funds-flow scope, the executed year, the ACE reconciliation), the fixture stays and the expectation changes, each one
  named in the release notes.
- **The math gate:** implementation and the presweep finish first; then one full `npm run validate:math` on the final
  candidate (about six hours in the background; approved). Any later code change re-runs the checks it touches. The
  exact tested revision and every unresolved limitation are reported before release approval.
- **Version labels:** v2.00 follows v1.99. Versions are compared as (major, minor) whole numbers, never as decimals; the
  board's and the tools' version comparisons are checked for it.

#### 85. Splitting a total gives each odd dollar to the service it belongs to (review N01)
- **Found:** `apportion` worked each share out in floating point. $100,000,000 over [19,698,320, 191,126,895, 89,174,792]
  gave the first service $1 of the second's; the review's $7,652,408,746,072 gave the first $1 of the third's; and an
  exact tie went where rounding noise put it ($10,000,000 over 1 : 1 : 4 gave the spare dollars to services 1 and 3). The
  total balanced every time, so nothing called it.
- **As built:** each weight is read as an exact integer (`apExact`: a whole number as itself; one with a fraction as its
  mantissa, all over the smallest power of two among them -- exact, because that is what a floating-point number is);
  each share is the exact BigInt quotient and remainder, floored; the leftover dollars go to the largest remainders, ties
  to the lower service; no weight, evenly. All 16 callers are unchanged and now exact: the typed budget total, a total
  allocation, an old-style split, a prime's CLINs, the offices' shares, a requirement added by total, the CLIN request,
  a zeroed requirement's money spread back (`zeroSpread`), the absorber's floor, and the import's width repairs.
- **Checks:** `audit-recon.mjs` "v1.99 item 85": an integer oracle written in the test (fractions made exact by doubling,
  not by reading bits), eleven named splits, 1,576 swept cases (near-ties built at budget size, small ties, random to
  $10 trillion), and the typed budget total, a total allocation, an old-style split, a CLIN split and the Spend Plan
  Source's CLIN lines -- every service's dollars, not the total. 12 of 21 fail on v1.98; the rest are
  CONTROLS. Mutations: 5 new, 2 retargeted (`apportion-naive-round`, `apportion-drops-remainder`).

#### 86. A batch import that cannot be put back says so, and holds the board (review N02)
- **Found:** when the board on screen refused its appropriation after ⇊ Import several boards had written storage, the
  batch put storage back with `every()`, which stops at the first list that will not go back: it writes Full Fund before
  O&M, so a stuck Full Fund left O&M never tried. When its own second reading of storage failed, it put nothing back. It
  set no hold and offered no files, and said "This board is exactly as it was". A refusal that threw part-way left the
  board on screen half-changed and the journal paused.
- **As built:** the before-copy is `lsAll`'s own reading (it writes nothing when it cannot read); `lsPutBack` tries every
  list, newest first, and reads each back; `impBoardSnap` / `impBoardBack` put the board on screen back after a throw,
  journal included. Any list not as it was goes to `batchImportUndone`, as a full import's failure goes to
  `fullImportUndone`: the mix is marked (`kind:'batch'`, so a reload names it), 💾 Save, the shared folder and the autosave
  are held by the same `impMixedBlock`, the board as it was and each file taken are offered to save, and every list is
  named. "Allow 💾 Save again" reads for either import. A new paragraph in Help, *One appropriation in or out*.
- **Checks:** `audit-import.mjs` "v1.99 — a batch that cannot be put back…": a list stuck first, last, both, and with a
  list that held nothing before; storage unreadable before the write; a refusal that throws after changing memory; the
  hold on Save, the folder and the autosave, and after a reload. 22 of 23 fail on v1.98 (⬇ Save a copy is a
  CONTROL). Faults are injected; no natural cause of the late refusal is known. Mutations: 8 new.

#### 87. The reprogramming $M field reads the whole entry (review N03)
- **Found:** `rpAmtTyped` cut the entry to 60 characters before reading it. "1", 59 spaces and "oops" was $1M and replaced a
  $5M row; "0.000001", 52 zeros and "1" -- not whole dollars -- was $1.
- **As built:** the whole entry is read; one longer than `RP_AMT_MAX` (200 characters) is refused as such; only the text
  quoted back is shortened (`rpCut`), after the decision. A sentence in Help, *The reprogramming log*.
- **Checks:** `audit-recon.mjs` "v1.99 item 87": twelve entries from 59 to 201 characters; a refused one leaves the row's
  figure, its stamp, the log's stamp and the stored bytes as they were. 6 of 12 fail on v1.98 (the rest are
  CONTROLS). Mutations: 2 new. The codes cut to length are item 91.

#### 88. A locked cycle keeps the RCN / EEIC list it was locked with (review N04)
- **Found:** `cycLock` kept the years and the projection, not the RCN / EEIC list, and `cycView` read today's. Give a
  combination new codes and a locked cycle printed them; remove one and the cycle's money on it read "no RCN/EEIC
  assigned". Dollars did not move; the record of the past did.
- **As built:** `cycLock` keeps a copy of the list on the cycle (`rcn`); `cycView` puts it on screen (`cycRcnOf`), so the
  view and every report taken from it -- the RCN-EEIC tab and its CLIN breakout, the Spend Plan Source, the ACE tie-out --
  read the codes it was locked with. It travels with the cycle through the saved file and every import. A cycle locked
  before v1.99 is left as it is and read against today's list, and says so in the view's message, on its line under PPBE
  cycles and in the RCN-EEIC tab's title (`CYC_RCN_TODAY`); no past code is made up. A new paragraph in Help, *RCN / EEIC
  on a prime’s CLINs*. The other lists a cycle reads from today are item 89.
- **Checks:** `audit-recon.mjs` "v1.99 item 88": lock; renumber K1 and remove K3 in the working list; the view's RCN-EEIC
  summary and Spend Plan Source lines as locked; the same after saving and reopening; an older cycle's three notices.
  6 of 11 fail on v1.98 (the rest are CONTROLS). Mutations: 6 new.

#### 89. Found while building v1.99
- Logged under Open: what a locked cycle still reads from today (item 98 says it on the panel and in Help).

#### 90. Aircraft and engine quantities are whole numbers (found while scoping v1.99)
- **Found:** `setBuy` stripped every non-digit and read what was left: "1.5" was stored as 15, "−2" or "-2" as 2, "abc" as
  0. The adjusted quantity times the unit cost is the buy's dollars on its requirement, and the product was checked only
  when the cost was typed.
- **As built:** `qtyRead` takes a whole number from 0 (digits, or groups of three with commas; blank is 0) and refuses
  anything else -- a sign of either kind, a decimal point, a letter -- keeping the line as it was and saying so.
  `buyDollars(q, c)` is the exact product, or nothing when either side is not a whole number from 0 or the product passes
  $10 trillion (`IN_MAX_AMT`), whichever side is typed. A saved quantity that is not one is kept as saved, counts $0, is
  marked "not counted" in the buys panel and listed under **✈ buy quantities to repair** until typed again.
- **Found while testing it, and fixed:** the bound was read in a function `applyState` calls while the board opens,
  before the line that declares it had run; on a board with buy lines that stopped the board opening. It is read through
  `buyMax()`, and a check opens a saved board with buy lines and wants no script error.
- **Checks:** `audit-board.mjs` "v1.99 — a buy quantity is a whole number…": eleven refused entries, five taken (CONTROLS),
  both sides of the $10 trillion bound, saved quantities of −3, 2.5 and "7" kept and listed, the panel's totals, a save and
  reopen, and repair by typing; every dollar figure computed in the test in BigInt. 14 of 25 fail on v1.98; the rest are CONTROLS. Mutations: 6 new, 1 retargeted.

#### 91. Codes over their limit are refused, never cut (from item 87)
- **Found:** a typed PID or RCN / EEIC was cut to its length without a word, the new-requirement form cut its CCaR record
  to 12 as it was typed, a PMO submittal's CCaR record was cut to 12 on the way in, and a CLIN number or description, a
  WBS or a PPBE line code took any length.
- **As built:** one rule, `codeTake`, with the limits kept (CCaR record 12, PID 20, CLIN number 20, CLIN description 140,
  WBS 40, RCN / EEIC 10, PPBE line codes 12). A typed code over its limit changes nothing and keeps the text where it was
  typed: a box opens again holding it (PID, CCaR record, CLIN number and description, a CLIN's fields, WBS), an inline
  field keeps it, marked (WBS, PPBE lines, RCN / EEIC), and the new-requirement form keeps everything typed. A code that
  arrives in a file or a submittal is kept whole and listed under **✂ codes longer than their limit** and in Pre-flight.
  Two setters nothing called are removed.
- **Checks:** `audit-board.mjs` "v1.99 — a code longer than its limit…": each typed path at the limit (CONTROL) and one
  over, the form, a submittal, a saved file reopened, and that reading a prime's CLINs creates nothing. 12 of 13 fail on
  v1.98 (the one at the limit is a CONTROL). Mutations: 9 new.
- **Found while testing it, and fixed:** the check reads every prime's CLINs as the board draws, through an accessor that
  creates an empty entry when there is none, so a reopened board held empty CLIN entries its file never had (the round-trip
  fuzz caught it on a buy line marked as a prime). It reads them without creating anything (`clinListRO`), as the Classify
  grid's note (item 97) does.

#### 92. The funds-flow export writes the panel's selection (from item 82)
- **Found:** ⬇ Export funds flow wrote the last fiscal year on screen across every appropriation, whatever the panel
  showed; partner and FMS money was not said to be portfolio-wide.
- **As built:** the export reads `flowCalc()` -- exactly the panel's years and appropriations -- and `flowFy` is gone. A
  switched-off appropriation is not in the by-appropriation table. Partner and FMS money for the selected years is counted
  once and labelled **portfolio-wide**, not changed by the appropriation selection, on the panel and in the export.
- **Checks:** `audit-recon.mjs` "v1.99 items 92–93": the review's own example (FY25 + FY26, O&M only: US $3,000, partner
  $300, $3,300; no Full Fund line). Expected changes, fixtures kept: the v1.97 funds-flow tests now set the panel's
  selection (`flowCfg().fys`) instead of `flowFy`. Mutations: 3 new, 1 retargeted (`v197w6-flow-appn-label`).

#### 93. Execution is decided per appropriation and year (from item 82)
- **Found:** a year with execution imported for any appropriation was an executed year for all of them, so this board's
  own plan for it was not read: Full Fund FY27 executed $800 and O&M FY27 planned $5,000 printed $800.
- **As built:** `flowExecYears(slug)` and `flowYearKind(fy, slug)`; a mixed year is named in the scope, the year buttons
  and the banners (`FY27: O&M planned, FULL FUND executed`), and the export says the same.
- **Checks:** `audit-recon.mjs` "v1.99 items 92–93": $5,800 = O&M $5,000 planned + Full Fund $800 executed; FY26,
  executed for both, as before (CONTROL). Mutations: 1 new. Items 92 and 93 together: 8 of 11 fail on v1.98; the rest are CONTROLS.

#### 94. An office with only estimate lines is in the ACE reconciliation (from item 82)
- **Found:** an office with estimate lines and no requirement that year was left off the PMO block and its TOTAL (listed
  only under Lines Nothing Claims), so the TOTAL looked tied when it was not.
- **As built:** it has its own row (its estimate, board $0, the whole estimate as its variance) and is in the TOTAL, on
  the panel and in the export. Beneath the TOTAL: *Estimate for this appropriation = the TOTAL + lines under no office*,
  with DOES NOT TIE if it ever does not. Lines Nothing Claims says, beneath its list, that it is not a second count.
- **Checks:** `audit-recon.mjs` "v1.99 item 94": PSM 900 / 1,000 / +100, TSS 400 / 300 / −100, ATL 250 / 0 / −250
  (estimate only), TOTAL 1,550 / 1,300 / −250, and 1,550 + 100 = 1,650, the estimate. Expected change, fixture kept: the
  v1.97 ACE tie-out test checks the new accounted-for line on its own (it ties in both years). 4 of 6 fail on v1.98; the rest are CONTROLS. Mutations: 2 new.

#### 95. Side lists: staged imports, a failed share kept and said, and unsaved survives a reload (from item 82)
- **Found:** an execution import and a check of the folder for cost estimates wrote into the board as they read, so a
  failure part-way left half in memory, not stored and not counted unsaved; a log share stored its merge only after
  writing the folder; a destination list that only joined a name was changed in memory alone; and a side list edited and
  never saved read Saved once the board was reopened.
- **As built:** both imports stage and take everything only once all of it is read. A log share keeps the merge in
  browser storage first and says "kept in this browser, not shared" when the folder cannot be written (and that storage
  refused it too, when it did). Every change to the destination list is stored and counted. At opening, each list --
  this board's, and another appropriation's plan and locked cycles -- is compared with the file's copy (timestamps aside),
  by the rule a save uses to choose between them; one browser storage held that differs reads unsaved, named in the
  saved-state tooltip, until 💾 Save writes it. What opening an older file writes into its lists is still nobody's change
  (v1.97, item 76): it is remembered against that file, so the next opening reads it the same way. A list storage refused
  while opening stays unsaved.
- **Found while testing it, and fixed:** storing the destination list as the board opened stamped it with the clock, so
  two openings of one file saved different bytes (`boot-same`). What opening writes keeps the time it had, unless a key
  was made or moved there (then it is stamped as before, so that reading is never made again).
- **Checks:** `audit-import.mjs` "v1.99 — side lists…": an import whose second tab fails; a folder that fails after one
  estimate; a log share whose write fails, with and without storage refusing; a destination name joined; and reopening
  -- edited, saved, edited again, another appropriation's plan and cycles, a file newer than this browser's copy, a blank
  board, and an older file opened twice and then edited. 12 of 23 fail on v1.98; the rest are CONTROLS. Mutations: 7 new, 3 retargeted.

#### 96. Earlier copies of a cost estimate (from item 63)
- **Found:** replacing the folder's estimate kept the one it replaced in the folder's history, and nothing offered it
  back: putting one back was a rename in the folder by hand.
- **As built:** 📡 Live view → **🕓 Cost estimates kept** lists them, newest first, under the estimate each was kept for.
  **Put this back in the folder** pins the copy by its own name before the first wait (a list read again since puts
  nothing back), runs Replace's checks (whole, its own estimate, its fingerprint), keeps the folder's copy in the history
  first and reads it back byte for byte -- nothing is written when that fails -- reads the folder again just before the
  write and stops if it changed, and writes the kept bytes exactly. Only the folder changes. `snapMatch` matches a name as
  written (a '.' in an estimate's name made it match another's).
- **Checks:** `audit-import.mjs` "v1.99 — a cost estimate the folder kept…": listed; No; Yes (history then folder, both
  byte for byte, the board unchanged); the history refusing; a kept copy that does not read back; a late edit to the
  folder's copy; the list read again and the board's estimate changed while it runs; a stale button; a copy not whole,
  another estimate's, or off its fingerprint; a folder with no copy; and the name pattern. 16 of 18 fail on v1.98 (the fixture and the board left unchanged are CONTROLS). Mutations: 6 new.

#### 97. The Classify grid says when a prime's CLINs carry their own RCN / EEIC (from item 84)
- **As built:** the RCN / EEIC cell of a prime says "k of n CLINs carry their own"; the bulk set says what the column
  sets (the requirement's own combination, the default a CLIN with none uses) and how many primes have CLINs that keep
  their own. The setter is unchanged (a CONTROL checks it).
- **Checks:** `audit-recon.mjs` "v1.99 items 97–98". Mutations: 3 new.

#### 98. Say which classifications a locked cycle still reads from today (from item 89)
- **As built:** the PPBE cycles panel no longer says a cycle "still reads correctly after requirements are renamed,
  re-banded or removed". It and Help (*The five-year plan by PMO*) say what a cycle keeps -- every year's plan in its
  window, its projection and, from v1.99, its RCN / EEIC list -- and what it still reads as it is now: the destination
  list, the decision bands, a BAE budget set by rule, and requirement detail its plan never changed.
- **Checks:** `audit-recon.mjs` "v1.99 items 97–98" (items 97 and 98 together: 7 of 9 fail on v1.98; the rest are CONTROLS). Mutations: 1 new.

### v1.98 — 5 Oct 2026: item 83, built on Brad's "go" -- RCN/EEIC by service on each CLIN

One item, from Brad: a CLIN took one RCN/EEIC, so its USAF, ANG and AFRC money could not sit on different
combinations, and funding went missing on the RCN/EEIC reports. In most cases one combination is the standard for all
three; only a handful differ, and the CLIN's line had to stay as it is. Talked through with a prototype first; Brad's
answers: **the CLIN wins**, **flag gaps**, and **include the fix** to the RCN/EEIC tab.

**The final check** passed on the final tree, 5 Oct 9:06 pm – 6 Oct 2:58 am Eastern: **352.3 minutes**, every stage clean — the defect register (13 defects, 43 mutations), money coverage (26 of 26 surfaces), the money map (329 cells: 123 proven, 206 not applicable, 0 open), the trace matrix (92 cells), all eight suites, every browser check, the fuzz (seed 712613839) and the file verifier — and **all 1,069 planted mistakes caught** (11 more change nothing by design): v1.97's 1,041 plus 28 new, all presweept first. It passed on the first run, 17 minutes longer than v1.97's.

#### 83. RCN/EEIC by service on each CLIN, and the RCN/EEIC tab reads the CLINs (Brad, 5 Oct 2026)
- **Found (reproduced on v1.97, made-up figures):** a prime with two CLINs, $600 USAF, $300 ANG, $100 AFRC.
  - With a combination on every CLIN and none on the requirement, *RCN-EEIC by Month* put all $1,000 under "— no
    RCN/EEIC assigned —", while its own CLIN breakout and the Spend Plan Source named the combination: the summary read
    only the requirement's assignment.
  - With the requirement's ANG on its own combination and CLIN 0001 on the standard, the summary put ANG's $300 under
    the ANG combination and the Spend Plan Source under the standard. Two exports disagreed.
  - Removing a combination cleared the requirements pointing at it but not the CLINs, though its confirmation said it
    did; and the CLIN picker offered every combination, so one set up for ANG only could go on USAF money.
- **As built:**
  - **The CLIN's line does not change.** Its RCN/EEIC picker is the CLIN's standard for every Air Force service on it.
    A CLIN carrying money on two or more of USAF, ANG and AFRC has a **by service ▾** button that opens one line under
    it: each of those services, its dollars, and a picker starting at "= CLIN's"; ↺ puts them back. A choice is filed by
    the service's name (`clinRcnSvc[id][clinKey][service]`).
  - **Flags.** An exception is named on the button with the line closed ("ANG differs"). A service whose money on the
    CLIN lands on no combination -- none set, or one since removed -- says **not set**, in amber, on the button or, for a
    CLIN with one Air Force service, beside its picker. The RECORD panel's RCN / EEIC field reads the CLINs: it is
    complete only when every CLIN's money lands somewhere, and names the gaps.
  - **Fitting choices.** Each picker offers the combinations set up for its service (the standard: for every Air Force
    service on the CLIN). A saved choice that no longer fits is kept, selected and marked ⚠; one pointing at a removed
    combination says so. Never changed.
  - **One rule (Brad: the CLIN wins):** `rcnOfClinSvc(id, clinKey, service)` -- the CLIN's choice for that service, then
    the CLIN's standard, then the requirement's choice for that service, then the requirement's own.
  - **Every RCN/EEIC surface reads it.** *RCN-EEIC by Month*: the summary splits a prime's money by its CLIN grid
    (`clinSplit`, the same split as its CLIN breakout and the Spend Plan Source) and files each CLIN's part under that
    service's combination on that CLIN; the requirement section lists a prime under each combination it rides, with
    that share of its money and of its ask, marked; a prime funded nothing is listed the same way under NOT FUNDED. The
    Spend Plan Source asks for the service's combination on the CLIN. The ACE alignment breakout makes a line whose
    services differ a line per combination, its Navy and USMC money a line of its own -- the lines add to the line they
    replace -- and the mapping counts what the breakout prints.
  - **Removing a combination** clears every pointer at it in every year -- requirements, their services, CLINs and the
    CLINs' services -- and the confirmation counts them all.
  - **Carried everywhere a CLIN's combination goes:** saved file, copies to another year, imports (the import report
    counts them), the per-requirement registry; a renamed service keeps its choices, a removed service takes them with
    it. Old boards open exactly as they were.
  - **Help:** a new section, *RCN / EEIC on a prime's CLINs*.
- **Found while building, and fixed:**
  - Once the summary reads the CLINs, money on a combination since removed would have been in no row and no total (the
    summary lists only the list's combinations and the not-assigned row): it now counts as not assigned, and the CLIN
    breakout says so instead of "(blank combo)".
  - **An added CLIN deleted for good left its RCN/EEIC and its WBS behind** under its key, and the next added CLIN is
    given that key: the new CLIN arrived on the deleted one's combination and WBS split. They now go with it (a CLIN from
    the board's data, removed, keeps them: it can be put back).
  - The ACE breakout printed a requirement's own combination beside every Air Force dollar on its line, so a
    requirement with ANG on its own combination read as one line on the standard; the same split fixes it.
- **Checks:** three new scenarios in `audit-recon.mjs` and five in `audit-board.mjs`, and the per-requirement registry's
  sample; every new check fails on v1.97 unless labelled a CONTROL (recon 10, board 22, none throwing). 28 new
  mutations, each presweept: 28 of 28 caught. The round-trip fuzz and the hostile board seed the new choices; the
  conformance run opens a CLIN drill with them and fails if they are not on screen.

### v1.97 — 5 Oct 2026: items 62 and 72–81, built on Brad's "go" -- the 5 October review of v1.96, and the money map's nine cells

**The money is right where it was not.** An independent engineering review of v1.96 (5 Oct) found ten ways the board could
gain, lose or misplace a dollar or lose work; every one was reproduced on v1.96 and every one is fixed. Typing a budget
total keeps every dollar; an old-style split funds both of its lanes; a negative allocation is refused; typed money is
read whole -- "abc" no longer turns a $500 requirement value into $0, and "750K" in a $M field is no longer $750,000,000;
every edit the saved file carries marks the board unsaved; ⇊ Import several boards decides before it writes; ↶ Put this
back pins its year before its first wait; a folder save keeps the copy it replaces or writes nothing; moving or removing
a service takes its dollars with it; and the reprogramming log reads each row's service from its own appropriation, in
whole dollars.

**Every cell of the money map is proven** -- the nine Brad had deferred on 3 Oct included (his word, 5 Oct): 123 proven, 206
not applicable, none open. Each new cell is held by an oracle worked out from the fixture's own numbers, and two of them
found real defects: the 📋 Two Spend Plans funded a service above what it asked for when it was allocated or directed above
it, and the ACE tie-out's breakout note said its lines add up to what the board funds, which they do not.

**Found while integrating, and fixed:** the three imports that remap services (⇊ Import several, 🔁 Appropriation packages,
taking an appropriation from a consolidated file) relabelled an incoming board's data pack and left its figures in the
file's order, so every untouched requirement value sat on another service when that appropriation was next opened; an
import that reordered services also left the buy lines' adjustments and unit costs behind; and the Excel Two-Plan
Forecast said a requirement forced to Mandatory competes for discretionary in Plan A, which has not been so since 7 Sep.

**The final check** passed on the final tree, 5 Oct 1:42–7:17 pm Eastern: **334.9 minutes**, every stage clean — the defect register (13 defects, 43 mutations), money coverage (26 of 26 surfaces), the money map (329 cells: **123 proven, 206 not applicable, 0 open**), the trace matrix (92 cells), all eight suites, every browser check, the fuzz (seed 47996740) and the file verifier — and **all 1,041 planted mistakes caught** (11 more change nothing by design, as before): v1.96's 879 plus 162 new, 11 retargeted, all presweept first. It passed on the first run. It took 143 minutes longer than v1.96's, and this time the machine was not the cause: the fuzz and the file verifier ran as fast as before. The new checks are: the eight suites take 7.4 minutes (4.8 before), each planted mistake re-runs one of them, and there are 162 more. Allow about six hours. It is the same single `npm run validate:math`, run detached past the two-hour limit on background jobs as before.

#### 62. The money map's nine open cells (deferred by Brad 3 Oct; built on his word, 5 Oct 2026)
- **Logged:** 3 Oct 2026 (the pre-launch review's map); the 5 Oct review (R12) asked for them under the zero-tolerance bar.
- **As built:** Two Spend Plans × service, requirement and lane; Funds Flow × appropriation and year; ACE tie-out × year
  (W6); the ATR/BTR log × appropriation, year and service (W5, after item 81). Each oracle walks the fixture itself, with a
  different amount on every service, requirement, lane, appropriation and year, and compares to the dollar. The plans
  oracle found plans funding above the ask and forced rows asking for their trim: `fsDirVec`, inside the basis, is what
  both plans read now, and a legacy split asks for what the lane engine places (`scalarSrcVec`, integration).
- **Checks:** `audit-recon.mjs` "v1.97 W6 — the two spend plans…", "…the funds flow…", "…the ACE tie-out…", W5's
  "reprogramming log" scenarios and "v1.97 integration — a legacy split asks each spend plan…"; 137 of W6's checks fail on
  v1.96 (the funds flow and most ACE figures were already right -- oracles, labelled). `node tools/money-map.mjs`: 0 open.

#### 72. Typing a budget total keeps every dollar (review R01)
- **Found:** `setBATot` scaled each service into fractions and `applyBudget` rounded each alone: $1 over three services was
  $0, $7 was $6, $100,000,000 was $99,999,999. (Nothing on the screen called it in v1.96; fixed all the same.)
- **As built:** `apportion` spreads the typed total; a fractional v1.96 base reopens apportioned to its rounded total; the
  CLIN request (`clinSetReq`) spreads the same way.

#### 73. An old-style split funds both of its lanes (review R02)
- **Found:** a legacy `{m:'split', d, mnd}` spread mandatory over the same basis as discretionary; on a tie it was clipped,
  and a $1 + $1 split on [1, 1] funded $1 while the row still totalled.
- **As built:** mandatory is placed against what discretionary leaves of each service (`scalarSrcVec`), read by the lane
  engine and the Two Spend Plans alike.

#### 74. A negative allocation is refused (review R03)
- **Found:** `-2` on a requirement of [1, 1] was taken; its basis went to [-1, -1] and `d + m + u` no longer held.
- **As built:** typed negatives are refused and the old value kept; `svcAlloc` floors at 0; a negative in an older file is
  kept exactly as saved and listed under Needs attention › ➖ negative allocations to repair.

#### 75. Typed money is read whole, and a typo never zeroes a figure (review R04)
- **Found:** `100oops` was $100, `1.2.3` was $1, `1e309` was $0, and `abc` over a $500 requirement value made it $0.
  Integration found the $M fields read the same way: "750K" in the Funds Flow was $750,000,000.
- **As built:** `amtRead` / `parseAmt` / `amtNo` (whole entry, whole dollars, `IN_MAX_AMT`, blank is a clear, anything else
  keeps the figure and says why) for all 18 editors; `amtReadM` for the Funds Flow and realignment $M fields.

#### 76. Every edit the saved file carries marks the board unsaved (review R05)
- **Found:** a reprogramming edit (and an ACE, execution or BAE import, a cycle lock, a package for another appropriation)
  never marked the board unsaved, though the saved file carries it.
- **As built:** `lsSet` counts every list the file carries (`fileKeyOf`, `_sideGen`); a file save acknowledges only what its
  bytes hold; a folder save never acknowledges the lists; a list storage refused stays unsaved until it is in the file.

#### 77. ⇊ Import several boards at once decides before it writes (review R06)
- **Found:** it wrote storage and `PUBS` before asking `applyStore`; a refusal still said "Imported" and the next reload
  opened the refused board.
- **As built:** a locked cycle, each appropriation's services (the others newly checked), two files for one appropriation
  and an unreadable file are all settled first; then one write; a late refusal puts everything back. The incoming packs
  follow a remap, figures and all, in all three remapping imports (`svcRelabelPacks`, integration).

#### 78. ↶ Put this back pins its year before its first wait (review R07)
- **Found:** item 66 (v1.96) pinned the year after the folder and the copy were read, so a switch during those reads was
  the year pinned.
- **As built:** appropriation, year, board, a year-switch count and the copy's name are pinned first; a stale list or a
  copy that does not match its name puts nothing back; the move check runs before the history keep and at the end.

#### 79. A folder save keeps the copy it replaces, or writes nothing (review R08; Brad: yes)
- **Found:** with the history copy failed it saved anyway, and autosave then said "Saved automatically".
- **As built:** every save that replaces a copy keeps its exact bytes first (a `…-recent.json` copy inside ten minutes of
  the last spaced one); if it cannot, ⛔ Not saved, nothing written, work still unsaved. History is thinned only after both
  land and reaches as far back as before. Autosave never writes over what its save said.

#### 80. Moving, renaming or removing a service takes its dollars with it (review R09)
- **Found:** on a board with no data pack, ▲▼ relabelled the dollars and removing a service cut the last column.
- **As built:** `svcSaveList(list, from)` carries every per-service list in every year, the data, the packs, held
  submittals and this appropriation's reprogramming rows (named rows keep their name -- integration); removal says what
  the service holds first; a kept PPBE cycle fixes its services; a data-backed board shows the list only. A new Help
  section says so. An import that reorders services now takes the buy lines with them (integration).

#### 81. The reprogramming log reads each row's service from its own appropriation, in whole dollars (review R10; Brad: no fractional values)
- **Found:** a $1M Full Fund row exported from O&M showed no service, and the summary by service totalled $0.
- **As built:** each row keeps its service by name (sealed by its place), read against its own appropriation's list;
  older rows are read by position and marked until picked; Unresolved is counted; the $M field takes whole dollars only;
  a saved fraction is kept, marked and named in the export's Check column; every net is exact. A new Help section.

**Checks for 72–81:** new scenarios in `audit-board.mjs`, `audit-import.mjs` and `audit-recon.mjs`; every new check fails on
v1.96 unless labelled a CONTROL (W1 104 of 145, W2 42 of 204, W3 38 of 45, W4 29 of 36, W5 51 of 65, W6 137, the
integration's 9 of 10). 162 new mutations and 11 retargeted, each presweept: 180 of 180 caught (those 173, and 7 existing ones on the import and restore code W3 changed; in three parts: 22, then 157 of 158, then 1 of 1 once a new check covered taking an appropriation from a consolidated file).

### v1.96 — 4 Oct 2026: items 64–70, built on Brad's "go" -- the menus, and the 4 October review of v1.95

**The menus are shorter, grouped by the job.** Reports & exports, 📁 File, Setup and Filter open folded: their everyday
items, then a heading for each group with how many it holds. A heading opens its group in place, under itself -- one at a
time, and each menu opens again on the group used last, in this browser. Reports & exports opens at 7 rows where it showed
25, Setup at 3 (was 19), File at 6 (was 15), Filter at 3 (was 13); a Find box in Reports & exports lists every report or
export whose name you type. Set base year, Reset and Funding realignment live on the year menu only, WBS from execution
data under Data. No item was lost (103 became 101: the two duplicates went), and no figure, export or saved file changed.

**Five more ways work could be lost are closed** -- an independent review of v1.95 (4 Oct) reproduced each:
↶ Put this back replaced an edit typed while the folder was being written; ⇊ Import several boards at once wrote one
appropriation and reported both when storage refused the second; sharing the reprogramming log wrote over a folder log it
could not read; a shared state file that answered late replaced work typed after opening; and a repaired award's original
record was cut at 100,000 characters, losing awards the repair had set aside. Every one now keeps the work, or refuses
and says so.

**The browser checks reach the repaired-award controls**, and found that every box's ✕ Close had too faint an edge and
too small a target; all 49 are fixed.

**The final check** passed on the final tree, 4 Oct 1:43–4:54 pm Eastern: **191.6 minutes**, every stage clean — the defect register (13 defects, 43 mutations), money coverage (26 of 26 surfaces), the money map (329 cells: 114 proven, 206 not applicable, 9 open by Brad's decision), the trace matrix (92 cells), all eight suites, every browser check, the fuzz (seed 37296655) and the file verifier — and **all 879 planted mistakes caught** (11 more change nothing by design, as before): v1.95's 849 plus 30 new, 3 retargeted, all 33 presweept first. It passed on the first run. It took 54 minutes longer than v1.95's: every stage ran 35–50% slower, including the fuzz and the file verifier, which this version does not change, so most of the extra time is the machine rather than the new checks. It is the same single `npm run validate:math`, run detached past the two-hour limit on background jobs as before.

#### 61. Reconcile the pre-launch review's own report and evidence
- **Logged:** 3 Oct 2026, from Codex's scope review. The review's report and its attachments never reached the
  session that built v1.95; every finding was reproduced from the handoff's description. Before any finding is
  called closed, obtain the report and the attachments and reconcile them against items 47–60.
- **Closed in v1.96:** the 4 Oct review (Brad pasted its report into the session) reconciled R01–R12 against v1.95 in its
  own table: each holds as fixed, within the cases tested, with five gaps -- NR01–NR05, items 66–70 below. The review's
  evidence package (`review-results/`, its probes and raw outputs) is on Brad's machine and did not reach the session;
  the regressions below re-create each probe from the report.

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
- **As built:** `buildPopulated` (`tools/ia-fixture.mjs`) gives the board every browser check loads two awards it repairs on
  opening -- one SPLIT INFERRED, one NEEDS REPAIR -- so the 🔧 list and ✓ Checked are drawn. `keyboard-reach.mjs` L reaches
  the 🔧 entry, its list, Go to it and ✓ Checked from the keyboard and uses each; `standards-check.mjs` measures the list open
  and the award block with ✓ Checked, and fails (a "coverage" finding) if either is not on screen to measure.
- **Found by it, fixed:** every box's ✕ Close (`.modal .x`, 49 boxes) had a 1.4–1.6:1 edge and stood about 20px tall --
  1.4.11 and 2.5.8. It wears `--edge` now and is at least 24px. The run had never opened a box.
- **Proven by:** on v1.95's fixture, keyboard L fails 4 checks and the standards run fails with "the repaired-award controls
  were not on screen to measure"; with the ✕ Close as it was, the standards run reports 6 new findings.

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
- **As built:** `syncBtns` builds each long menu with `grp(menu, key, title, items, now)`: a heading button (`.gh`,
  `aria-expanded`, `aria-controls`, its count) and the group's items in a `.gbody` that is `hidden` until opened -- in the page,
  so every path, test and census still finds them. `menuGrp` opens one group per menu (`menuGrpOpen`, kept in browser storage
  as `spmtMenuGroups`, never in the file) and puts focus back on the heading; a heading's click stays in the menu. Filter opens
  on the group holding a filter that is on (`menuGrpAuto`). Find (`#mFind`, `menuFind`/`menuFindApply`) narrows in place, by
  item or group name, and empties when the menu closes. In a PMO copy ✉ Submit input is unfolded on top of File and there is
  no Program offices group. The open menu is fitted to the window again after it is drawn (a group opening made it taller and
  wider -- found by the drop-down check at 761×960 in the Segoe stand-in). The Help guide's paths and the board's messages name
  the group; the paths check now fails a path to a folded item that does not.
- **Checks:** `audit-board.mjs` "v1.96 — a long menu folds by the job, one group open at a time (item 65)": 8 of its checks fail
  on v1.95, then it throws there (no `menuGrp`). `audit-import.mjs` "v1.86 — the File menu, grouped…" now asserts the new
  groups and the copy's unfolded Submit input. Browser: `keyboard-reach.mjs` G2 (every heading, every item, Find),
  `dropdowns-visible.mjs` opens every group at 8 sizes in both fonts (408 opened), `standards-check.mjs` measures every group,
  `menu-paths.mjs` checks each path's group, `ia-census.mjs` reads folded groups.

#### 66. ↶ Put this back never drops an edit typed while the folder is written (review NR01)
- **Logged:** 4 Oct 2026, the review of v1.95: "History restore discards an edit entered while history is being written."
  `driveRestore` decided whether the work on screen needed keeping before reading the folder and writing its history, then
  adopted the earlier copy after those waits without looking again.
- **As built:** the appropriation and year are pinned before the waits; after the last wait, with nothing waiting between,
  a board that moved is refused ("Nothing was put back"), and whether the work on screen is in a saved copy is decided then,
  the late edit included -- kept aside, or, with other work already kept or no room, nothing is put back and the work stays.
- **Checks:** `audit-import.mjs` "v1.96 — ↶ Put this back never drops an edit typed while the folder is written (NR01)": a clean
  start, an already-unsaved start, a year switch, an occupied slot and refused storage, each with an edit typed while the
  history write is held. All 5 fail on v1.95; the fixture is a CONTROL.

#### 67. ⇊ Import several boards at once is all or nothing (review NR02)
- **Logged:** 4 Oct 2026, the review: "Batch board import ignores a refused write and reports success." `importBoards` wrote
  each appropriation with `lsSet`, ignored the answer, updated memory, and listed every file as imported.
- **As built:** every appropriation the batch carries is committed through `lsAll`, all or nothing; memory changes only after
  every write has landed; a refusal is reported as the other imports report one (`fullImportUndone`, with the stopped-import
  hold if putting back also fails), and a batch that lands lifts that hold (`impMixedLift`).
- **Checks:** `audit-import.mjs` "v1.96 — ⇊ Import several boards at once is all or nothing (NR02)": refused at O&M, refused at
  Full Fund -- both fail on v1.95; nothing refused is a CONTROL.

#### 68. The reprogramming log is never shared over one that could not be read (review NR03)
- **Logged:** 4 Oct 2026, the review: "Sharing the reprogramming log overwrites an unreadable folder copy." `driveRpPush` took
  every failure to read or parse the folder's log for "no log" and wrote over it.
- **As built:** only `NotFoundError` means no log. A log that cannot be read, is refused, or is not whole stops the share and
  says so; one that can be read is merged and kept in the folder's history (`history/…rp-log…`) before it is replaced.
- **Checks:** `audit-import.mjs` "v1.96 — the reprogramming log is never shared over a folder log that could not be read (NR03)":
  unreadable (NotAllowedError), half-synced, readable (kept in history first) -- all 3 fail on v1.95; no log is a CONTROL.

#### 69. A shared state file that answers late never replaces work (review NR05)
- **Logged:** 4 Oct 2026, the review: "A delayed JSON-sidecar response overwrites newly entered work." The loader adopted the
  legacy shared state file whenever its time was later, without asking whether the work on screen was in any saved copy.
- **As built:** the answer is handled by `sharedArrived`, under the shared folder's rules: work typed this session --
  nothing is replaced, and loading it by choice (`adoptShared`) keeps that work aside first; work from an earlier session no
  saved copy has -- kept aside first (`sharedKeepMine`); other work already kept, or no room -- nothing is loaded.
- **Checks:** `audit-import.mjs` "v1.96 — a shared state file that answers late never replaces work (NR05)": 4 fail on v1.95
  with only its callback named (v1.95's has no name to call); nothing unsaved is a CONTROL.

#### 70. A repaired award keeps its original whole (review NR04)
- **Logged:** 4 Oct 2026, the review: "Award repair truncates the original record it promises to preserve." The original was
  cut at 100,000 characters, and an award the repair set aside is in nothing else.
- **As built:** the original is kept whole (`awdOrigKeep`): longer than 100,000 characters, as a list of pieces each the import
  door takes (it refuses any one text over 200,000), read back joined (`awdOrigText`); the door accepts the pieces. What the
  award block shows is still cut; what is kept is not.
- **Checks:** `audit-import.mjs` "v1.96 — a repaired award keeps its original whole, however long (NR04)": 2,600 and 4,000
  malformed increments, and saved, reopened and through the import door -- 3 fail on v1.95; 10 increments is a CONTROL.

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

