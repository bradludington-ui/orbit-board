# AGENTS.md — ORBIT

For any coding agent working in this repository (Codex and others). The full working notes are in
**`CLAUDE.md`**. Read it before changing anything. This file is the short list of rules that must not
be broken.

## What this is

- One self-contained HTML application: **`prioritization-board-grid.html`** (~26,700 lines, no build
  step, no dependencies of any kind). It is edited directly; there is no generator to run.
- One build since v1.88. The card build (`prioritization-board.html`) was retired; it exists only in the
  git history. Do not recreate it.
- The tooling in `tools/` is Node (jsdom, playwright-core). Every browser check finds Chromium through
  `tools/chrome.mjs` (`CHROME_BIN`, then `/opt/pw-browsers/chromium`, then the newest
  `/opt/pw-browsers/chromium-*`); never run `playwright install`.

## The two can't-fails: data loss and math

Every figure the board prints or exports is briefed to decision makers, so it must be exactly right, and
nothing a person enters may be silently lost. Read "The funding model" in `CLAUDE.md` before touching any
calculation or export. Money is whole dollars.

## Never commit a populated board

A saved board is the program and the budget data fused into one file. The repository holds the program
only. `.gitignore` refuses every `.html` except the board, and `npm run check` fails if board state is
committed. A real saved board is read from outside the repository and never added to it.

## How changes ship

Changes are queued in **`NEXT-VERSION.md`**. Nothing in the board changes until Brad says **go**. On go:
build every open item, run the full math check once, bump `BUILD` once, push once, and move the items to
*Shipped*, saying there anything that was built differently from what was logged.

## Checks

| When | Command | Must show |
|---|---|---|
| Before every commit | `npm run check` | `all checks passed` |
| After a change | `npm run audit` | 8 suites: 7 `ALL CHECKS PASSED` banners plus the legacy line |
| After a change that moves anything on screen | `npm run verify:grid` | exit 0 |
| After a change to anything a person operates | `npm run standards` and `npm run keys` | no NEW finding (the baseline is empty since v1.92); every keyboard check `ok` |
| After a change to money on screen or in an export | `npm run money-map`, then `node tools/money-map.mjs --check` | `money map holds`, the report current |
| Before a version ships | `npm run validate:math` -- **only on Brad's named go** (see below); at 2,021 mutations it takes most of a day, in saved batches | `MATH VALIDATION PASSED` |

- In the math check, a mutation that is **NOT APPLIED** fails the run. If you rewrite a line that a
  mutation in `tools/export-audit/mutate.mjs` searches for, retarget that mutation.
- **The sweep runs only on Brad's named go** (Brad, 20 Oct 2026). During development `tools/export-audit/mutate.mjs` is
  TEXT ONLY: build a mutant with `recovery/v200/bin/mkmut.py` and count every target with `recovery/v200/bin/mcount.py`
  (`python3 -I`); never `import` it (loading it starts the sweep) and never run `npm run mutate` or `validate:math`. A sweep,
  when Brad names one, runs on a committed tree that does not change while it runs, in saved batches that survive a container
  restart, with nothing else running, and it reports and changes nothing.
- A test that cannot fail is not a test. Prove a new check fails on a board with the defect before
  trusting it.
- A presweep of your new mutations does not see an OLD mutation whose line your change rewrote. After any
  change to the board, and after every merge, count every mutation's target against the board (the gate's
  first step does it; finding it there costs a two-hour run).

## Files from outside are data, never code

- Every way a file comes in goes through `inboundCheck()` before any of it is read.
- A value written into an inline handler goes through `jsa()`, and nothing else does; `npm run check`
  fails otherwise.
- Text written into HTML goes through `esc()`.
- `audit-hostile.mjs` and `tools/hostile-render.mjs` prove all three. See the v1.88 section of
  `CLAUDE.md`.

## Do not

- Add a kind of per-requirement data without putting it on `REQ_MAPS` in the board: delete, move-to-year
  and copy-to-year all read that one list, and the round-trip fuzz fails by name on one that is missing.
- Write over a saved copy -- the file, or the shared folder's -- that could not be read, or decide whether
  work is unsaved by comparing two computers' clocks. See the v1.89 section of `CLAUDE.md`.

- Put a new editor on a requirement's row, or let a workspace mode change a figure. The row is for triage.
  Its direct decisions are rank (the rank box, ▲▼ in Rank, the ⠿ handle), ★ Mission Critical and, in Fund
  only, the total allocation for a requirement not on a Split. Lifecycle actions are in its ⋯ menu. The CLIN
  drill opens inside the row for a CLIN requirement. Everything else, per-service funding included, is
  edited in the RECORD panel. A mode (Review, Rank, Fund, Compare, Brief) or a density changes only what is
  shown, never a figure, and is this browser's setting, never written into the file. `npm run controls`
  records each control with its surface (row or RECORD panel) and fails on one added or moved; `npm run
  layout` holds the modes. See the v1.90 and v1.91 sections of `CLAUDE.md`.
- Put a click handler on anything but a native control (a `<button>`, not a `<span>`, `<div>`, `<a>` with no
  address or `<td>` with `role="button"` -- only an SVG group may say `role="button"`, with an `aria-label`), or
  redraw a control someone is using without keeping their place. `npm run check` fails on the first; `npm
  run keys` and `npm run panels` on the rest. See the v1.92 section of `CLAUDE.md`.
- Decide anywhere but `budResolve()` whether a stored BAE budget can be used, or let a choice it calls unusable
  be printed or quietly replaced by the rule. Record anything about an IDS export: the ORG is the one thing
  kept. Let the IDS export build anything before its refusals (locked view, PMO copy, its own check, the
  prompt). `audit-other.mjs` proves each, and its mutations must stay caught.
- Put a raw value into the diagnostics list (`DIAG`) or the diagnostics file. Every entry goes through
  `diagClean()`, and the file holds counts, never a figure, title, name, CCaR record, PID or budget name.
  `audit-other.mjs` proves it, and its mutations must stay caught.
- Place a funded dollar in a month anywhere but `landSvc()`, or hand it an office's share as the amount: the
  fill is not proportional, so pass the whole lane amounts and the share as `f`. Discretionary fills the awards
  forward from the first, mandatory backward from the last, and what they do not cover is UNSCHEDULED.
  `audit-board.mjs` "v1.93 — mandatory awards last" holds it. See the v1.93 section of `CLAUDE.md`.
- Decide a CR half-month from anything but the award's own date (`landSvc`'s `day`, read through `awdDay`), or
  write `S.crHalf` again: the old marks are kept and decide nothing. Sort awards with anything but `awdCmp`; `npm
  run check` refuses it. See the v1.94 section of `CLAUDE.md`.
- Add a box that is not a direct child of `<body>` with class `modal-bg`, an id, a `.modal`, an `<h3>` naming it
  and a close control, or give a box an Esc handler of its own: one controller (`dlgSync`) drives them all.
  A field a box saves only with its own button needs `data-held="1"`, or typing in it is not guarded. `npm run
  check` fails on a box of the wrong shape, `npm run dialogs` on one that does not take and give back the
  keyboard. Do not let a menu run off the window: `fitMenus()` and `npm run dropdowns`.
- Write a board file's payload anywhere but `savedHtmlOf()`: 💾 Save, the PMO copy, the work kept aside and the
  board as it was before a failed import all go through it, so a field added to the saved file reaches all four.
- Write a save outside `saveSerial()`, mark the board clean unless `_saveGen` is what it was when the bytes were
  taken, or let a queued save write a year or a file other than the one it was asked for. Save over a file whose
  recorded writer is someone else, or claim one from an autosave: the guarantee is the folder's permissions, and
  ORBIT's check is cooperative. Replace work kept aside without asking. See the v1.95 section of `CLAUDE.md`.
- Write the shared folder's copy of a board anywhere but the checked folder save (`_driveStorePushRun`, through
  `saveSerial`): ⬆ Publish now in the folder is that save. Replace what is on screen with a stored, folder or
  history copy without `keepAside()` first.
- Let an import write browser storage except through `lsAll()` -- the ordinary import records its writes
  (`_lsCapture`) and commits them there -- or let anything write over the board file
  while a failed import's mix stands (`impMixedBlock`). Write over a shared cost estimate that is different, or
  that could not be read.
- Split a whole-dollar amount across offices or CLINs by multiplying it by a fraction: `pmoSplit`/`pmoPartsOf`
  and `clinSplit` apportion it, in whole dollars that add up exactly.
- Take an award from outside the board without `awdNorm()`: at a door it refuses or converts; on opening it
  repairs, keeps the record as found (`aw.fix`) and reports. An award is never zeroed.
- File a year's money under any PMO but the one that year assigns (Brad, 3 Oct 2026: "leave the PMO assigned by
  year"), or apply a held submittal to a year other than its own.
- Add money to a screen or an export without its row in `tools/money-map.json`: the gate's "money map" stage
  fails on a surface, a cell or a cited check that is unaccounted for.
- Let a whole-store adoption -- ↶ Put this back, the folder's newer copy, the legacy shared state file -- decide
  whether the work on screen is saved before its last wait: decide it, keep it aside (`keepAside`), and adopt in one
  step after the last wait, with the appropriation and year it was asked for pinned. `'occupied'` or no room stops it.
- Take a failure to read a shared side file (a cost estimate) for "no file": only
  `NotFoundError` means absent; anything else stops the share. Keep the folder's copy in its history before replacing it.
- Cut what a repaired award keeps as its original: `awdOrigKeep` keeps it whole, in pieces the import door takes.
- Give a long menu (more than about ten items) anything but folded groups built with `grp()` in `syncBtns`, one open
  at a time (Setup on the left menu, Filter), or, in a left-menu box, labelled sections (`sec()` and `card()` in
  `syncBtns`: Reports & exports, Data); or name a menu path to a folded or sectioned item without its group -- `npm run
  menus` fails it. A list of choices (the offices) never folds.
- Give an action a second home (v2.00, menu; Brad, 19 Oct: "each action has exactly one home"). Every action the old
  top-right menus (💾 Save, Reports & exports ▾, Data ▾, Setup ▾, 📁 File ▾) held is in one place on the LEFT MENU:
  Reports & exports, Imports & exports, Data, Program offices, Audit, History & recovery, Setup, and 💾 Save pinned at its
  foot (with Ctrl+S, and Save a copy under its ▾). A view lives in its section's flyout (FYDP ▸, Execution ▸) only. The
  named exceptions are Save (button and Ctrl+S), Live view (Setup › Live view and History & recovery › Earlier copies) and
  work kept aside (History & recovery and the save state's notice). Do not add a task-bar or toolbar button that repeats
  a left-menu item, or a menu at the top right. `npm run leftmenu` fails either; where each old item went is in
  NEXT-VERSION.md's v2.00 menu entry and CLAUDE.md's "Where every action lives".
- Read a typed amount with anything but `parseAmt` (and `amtNo` in the editor), or a $M field with anything but
  `amtReadM`: the whole entry reads as an amount or it is refused, and the figure it had stays. Text that cannot be read
  never becomes zero, and nothing over `IN_MAX_AMT` goes in.
- Let a negative allocation into a figure: `svcAlloc` floors each service at 0 (`svcAllocAsSaved` is the raw value). A
  negative arriving in an older file is kept exactly as saved and listed under Needs attention for repair.
- Place a whole-requirement source -- forced Disc or Mand, or a legacy `{m:'split', d, mnd}` -- anywhere but
  `scalarSrcVec`: the lane engine walks it and the Two Spend Plans ask for it (through `fsDirVec`), inside the basis, so
  no plan funds a service above what it asks for.
- Write a list `savedHtmlOf()` carries anywhere but through `lsSet()`, under a key `fileKeyOf()` names, or fold those
  lists into `DIRTY`: they move `_sideGen`, a file save acknowledges only what its bytes hold, and a folder save never
  acknowledges them.
- Let an import write before every refusal is settled -- a locked cycle, each appropriation's services, two files for one
  appropriation, a file that cannot be read -- or remap a board's state without its data packs: `svcRelabelPacks` puts
  an incoming board's packs in the new order, figures and all, not only the names.
- Let a folder save replace a copy it could not keep first, thin the history before the write and the copy have both
  landed, or let the automatic save write over what its save said.
- Change a board's service list anywhere but `svcSaveList(list, from)`, or carry any per-service list across a list
  change by position. A kept PPBE cycle fixes the services it holds.
- Drop, rewrite or stop carrying the reprogramming log (`RPDB`, `rpDb` in the file, `prio27reprog`). The ATR/BTR tracker
  was removed in v2.02 and the log is carried, not shown; the service-list upkeep (`svcSaveList`, `svcRenameKeys`) keeps a
  stored row's service meaning right, and nothing deletes a row.
- Ask which RCN/EEIC a dollar is on anywhere but `rcnOfClinSvc()` (a CLIN's money: its choice for the service, its
  standard, then the requirement's) or `rcnAsgOf(id, service)` (a requirement's), or file money on the RCN/EEIC tab
  under a key the list does not hold. Every RCN/EEIC surface reads that one rule, so they agree to the dollar.
- Leave a pointer at a removed combination, or an added CLIN's RCN/EEIC or WBS behind when it is deleted for good: the
  next added CLIN is given its key.
- Split a whole-dollar total anywhere but `apportion()`, or work a share out in floating point: it is exact (`apExact`
  weights, BigInt quotient and remainder), largest remainder first, ties to the lower service.
- Put several keys back with `every()` or anything that stops at the first failure: `lsPutBack()` tries each and reads it
  back, and a list not as it was goes to the mixed-import hold (`batchImportUndone`, `fullImportUndone`) -- never "exactly as
  it was". Take the before-copy from `lsAll`'s own reading, never a second one.
- Cut typed text before deciding whether it is valid: read the whole entry, refuse one that is too long, and shorten only
  the text quoted back.
- Lock a cycle without the lists its pointers are read through: a cycle keeps its RCN / EEIC list (`rcn`), and its view
  reads it (`cycRcnOf`). One without says so (`CYC_RCN_TODAY`); never fill a past code in.
- Cut a code to its length, typed or imported: a typed one over its limit is refused (`codeTake`) and the text stays where
  it was typed; an imported one is kept whole and listed (`codeIssues`).
- Read a quantity loosely, or multiply one into dollars without `buyDollars()`: a whole number from 0, and a product that
  is a safe integer within `IN_MAX_AMT`, or the line counts $0 and is listed.
- Read a `const` declared further down from code that runs while the board opens (`applyState` and everything it calls):
  it throws, and the board stops opening. Read it through a function that cannot throw (`buyMax()`).
- Export the funds flow from anything but `flowCalc()` -- the panel's selection -- or decide a year executed for every
  appropriation because one has execution (`flowYearKind(fy, slug)`).
- Count a side list as saved because a counter started at zero: what browser storage held before opening, and a save
  would write over a different copy, is unsaved (`sideBootCheck`) -- while what opening an older file wrote itself is not.
- Write a side list into memory part-way through an import or a folder read: stage it, and take it only once all of it
  is read.
- Rename the browser-storage keys `spmtTheme`, `spmtSeen`, `spmtMode`, `spmtDensity`, `spmtDetail` and
  `spmtMenuGroups`, or the package signature `spmtPkg`.
- Commit or push from a scheduled or unattended run. The nightly jobs validate and report only.
- Work in this repository while another agent is changing it: one agent at a time, so changes do not
  collide.

## Read-only monitoring roles

The four monitoring profiles are listed in [.agents/monitoring/README.md](.agents/monitoring/README.md): money review, data preservation, regression checks and environment acceptance. They report findings to Brad and do not edit, commit, push, merge or publish. Scheduled tasks are configured separately. Real Windows/shared-folder/native-export acceptance requires a human operator. The one-editing-agent rule and all release checks above still apply.


## Implementation ownership and handoffs

Before beginning work, read [WORK-ASSIGNMENTS.md](WORK-ASSIGNMENTS.md) alongside CLAUDE.md. Brad assigns implementation scope; a review finding is not permission to fix it. Claude is the default release implementer and integrator; Codex independently reviews and may implement specifically assigned fixes or tests. These are defaults, not an assertion that either agent is currently working.

Only one agent may edit repository code at a time, including tests. Use isolated branches and disposable review copies. Before changing owners, the outgoing owner stops edits and hands off an exact commit SHA, scope, validation results and remaining risks; Brad confirms the next owner. Separate branches do not waive this rule. Never infer that another session has stopped from a stale assignment file. If ownership is unclear, continue read-only work and ask Brad before dependent edits.

Pin review feedback to the handed-off SHA. Further pushes are new review work. One designated gate owner runs the release gate; other agents inspect evidence rather than starting duplicate long runs. Merge and publish require Brad's authorization. Scheduled monitors remain read-only even when an interactive Codex task is assigned implementation work.
