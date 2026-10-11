# Next version — queued changes

Changes are logged here as they come up and built together as ONE version when Brad says **go**.
Nothing on this list touches the board until then. On go: build every open item, run the full
math gate once, bump the version once, push once, and move the items to *Shipped* with the version.

Current version: **v2.00**. Next: **v2.01**.

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
  - The FY25 year button's tooltip still says FY25 "has no O&M execution imported" when its rows were imported and all
    count as FY26. The planned-year note likewise says "nothing in scope has executed in that year yet". That wording is
    unchanged.
  - **Money completeness, for Brad's decision (found before this change, not changed by it).** A year that only
    carried rows count in -- outside the plan window and with no rows of its own -- is not offered as a year button, and
    the ALL YEARS total **leaves those carried dollars out, with nothing on screen or in the export saying so**. The
    adversarial review confirmed it. It is proposed to Brad as its own finding rather than folded into R1.
  - An FY25 that the board holds no plan for, whose rows all count as FY26, now reads **$0 planned** (labelled PLANNED,
    its chip marked plan). Before it read $0 executed. The first note here called this unchanged; the adversarial review
    showed it changed. No dollar figure changes: it is $0 either way.

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

