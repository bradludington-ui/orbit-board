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
| Before a version ships | `npm run validate:math` (about 2 hours; ask Brad before running it past the two-hour limit on background jobs) | `MATH VALIDATION PASSED` |

- In the math check, a mutation that is **NOT APPLIED** fails the run. If you rewrite a line that a
  mutation in `tools/export-audit/mutate.mjs` searches for, retarget that mutation.
- Run the sweep through `npm run mutate` or `validate:math`. Never `import` `tools/export-audit/mutate.mjs`:
  loading it starts the sweep.
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
- Let a full import write browser storage except through `lsAll()`, or let anything write over the board file
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
- Rename the browser-storage keys `spmtTheme`, `spmtSeen`, `spmtMode`, `spmtDensity` and `spmtDetail`, or
  the package signature `spmtPkg`.
- Commit or push from a scheduled or unattended run. The nightly jobs validate and report only.
- Work in this repository while another agent is changing it: one agent at a time, so changes do not
  collide.
