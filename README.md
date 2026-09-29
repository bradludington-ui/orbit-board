# ORBIT — Out-year Requirements & Budget Integration Tool

<img src="assets/logo/orbit-lockup.svg" alt="ORBIT — Out-year Requirements &amp; Budget Integration Tool" width="440">

*The five-year spend plan across every appropriation.* Formerly SPMT, the Sustainment Portfolio
Management Tool; renamed 22 Sep 2026 because it plans more than sustainment.

A prioritization board for building and defending a sustainment budget: rank requirements, see what
the money covers, move funding between services and years, reconcile against execution data, and
produce the workbooks and briefing slides the review boards expect.

The whole application is **one HTML file**. No install, no server, no build step, no dependencies of
any kind — not a single script, stylesheet, or font is loaded from anywhere. Open it in a browser
and it runs, including from a shared drive or a `file://` path on a machine with no route to the
internet.

The board is `prioritization-board-grid.html`: a dense table of requirements with a docked record
inspector. ~25,500 lines · 3.2 MB. The version is stamped in its header (`BUILD`).

## One file (since v1.88)

Until v1.87 there were two looks of the same application: this grid, and a card layout
(`prioritization-board.html`, one panel per requirement). Every change was made twice and checked for
parity. The grid is the one in use, so v1.88 retired the card file; it remains in the project's
history. **A board saved by the card build opens in the grid with everything in it** — use
**📁 File → ⬅ Import a full board (new version)…** and pick the card file; the two always shared one
saved format, and the tests import a board written by the last card build to prove it. They also
shared browser storage, so a draft left in the card build is already in the grid.

## Getting started

1. Open `prioritization-board-grid.html`.
2. It opens as an empty **shell** — the program with no data in it.
3. Use **📁 File → ⬅ Import a full board (new version)…** and pick your saved board file. Requirements,
   budgets, every fiscal year, PPBE positions, locked cycles, logs and lists all load from it.
   **⬅ Import one appropriation…** takes just one, and changes nothing else.
4. **💾 Save** writes everything back into the file you are working from.

Use **Chrome or Edge**. Saving in place relies on the File System Access API; in other browsers the
board falls back to downloading a copy that you then have to move over the original yourself.

The board covers four appropriations — **O&M, Full Fund, Initial Spares, OPN** — switched from the
toolbar, each with its own state.

## What it does

**Build the year.** A ranked 1–N requirements list with decision bands, per-service splits,
mission-critical and unfunded flagging, filters, and a WBS and classification matrix behind each
requirement.

**Move the money.** A funding realignment tool that searches for cover across services and fiscal
years, shows the arithmetic before it suggests anything, and explains what it considered rather than
only what it chose. Plus a reprogramming (ATR/BTR) tracker, prime CLIN drill, and service
realignment that always preserves a requirement's total.

**Reconcile against reality.** Import a monthly CCaR QPE pull and compare it to the board — coverage
reporting, ORBIT-vs-CCaR reconciliation, obligation performance against OSD goals, and funds-flow
charts in four layouts.

**Look across years.** FYDP views, rolling requirements forward, PPBE spend-plan baselines, annual
cost estimate mapping and tie-out, dated snapshots you can return to and diff, and a continuing
resolution cash view over Oct 1 – Mar 31.

**See how short you are twice over.** Every requirement reports **Unfunded vs DISC** (the FY ask
minus what discretionary covered) beside **TOTAL Unfunded** (the ask minus discretionary *and*
mandatory). The gap between the two columns is what the mandatory pot is carrying. Both are
measured against the ask, never a trimmed allocation — money you asked for and did not get is
short however the cut was made — and both are floored per service, so a service funded beyond its
ask can never pay down another service's shortage.

**Every requirement carries an explicit split.** Funding is set per requirement as Split D / M / UFR
rather than left to an automatic lane walk. *Views › Convert all to Split* moves a whole board over
in one action, keeping every dollar exactly where it is — what changes is that the dollars stop
moving on their own when you reorder the list or change a topline.

**Ask "what if the mandatory money never shows?"** → *Views › Spend plan basis*. **◨ Discretionary
only** re-runs the spend plan with every mandatory lane empty, so what would have spilled into
mandatory reads as unfunded and never reaches a month. It moves the two by-month sheets and the
spend forecast — the board's own totals are unchanged — and every figure it moves is stamped
*DISCRETIONARY ONLY — mandatory withheld*, on screen, in the sheet titles and in the file name, so
a what-if cannot be mistaken for the funded plan once it has been emailed. **◧ Discretionary +
Mandatory** is the board's actual plan and the default.

**Get it out.** Excel workbooks (full breakouts, ACE tie-out, chart of accounts, ATR/BTR log, spend
plan source, CR cash return), CSV priority drills by band and per PMO, and a PowerPoint deck built
*inside* the real SFCB template so slides land on-brand. The XLSX reader and writer and the PPTX
writer are all hand-rolled against the browser's native decompression — there is no Office library.

**Work as a team.** Shared-folder, Confluence and SharePoint transports, plus a Live View so several
leads can work the same board without silently overwriting each other. Saves carry an editor name
and a timestamp, and a save that would clobber newer work stops and says so first.

## Repository contents

| | |
|---|---|
| `prioritization-board-grid.html` | The application. Source of truth. |
| `CLAUDE.md` | How to work on it — read this before editing. |
| `AGENTS.md` | The short rules for any coding agent (Codex and others), pointing to `CLAUDE.md`. |
| `tools/check.mjs` | Invariant checks for the board. |
| `tools/row-controls.mjs` | Lists every control a user reaches for one requirement; checks it against `tools/row-controls.json`. |
| `tools/export-audit/` | Drives the real exports in jsdom and checks every printed figure. |

```
npm run check
```

Runs the invariant checks. They verify that the script parses, the appropriation tables agree across
all six places they are declared, the save path still works, no board data has been committed,
nothing external is referenced, and no click handler writes a value into its code unencoded.

```
npm run controls
```

Enumerates every interactive control on a requirement's row and RECORD inspector from the rendered
page and compares it with the recorded list, so a control that disappears fails rather than going
unnoticed. A deliberate change is re-recorded with `node tools/row-controls.mjs --record`.

## The HTML is the source

This file was originally produced by a Python build script with its own test suite. Both were lost
with the machine they lived on, and comments inside the file still refer to them. The deliberate
decision, as of September 2026, is that **the HTML is edited directly** — there is no generator to
regenerate it from, and edits made here are not at risk of being overwritten by one.

`CLAUDE.md` carries what that means in practice: the save model, the values that used to be injected
per board and now have to be edited by hand, and the invariant that makes adding an appropriation
dangerous if done in only some of the places it is declared.

## A note on data

**The copy in this repository is deliberately empty**, and should stay that way.

A working board is not a document plus a database — it is the program and the budget data fused into
a single file, because saving rewrites the file's own embedded state. That makes any saved board a
data file, and it should be handled on the same terms as the budget detail inside it. Keep those on
the share, not here. `tools/check.mjs` fails the build if board state is ever committed, and
`.gitignore` keeps a stray saved copy from being staged by accident.

## The logo

`assets/logo/` holds the ORBIT mark: the wordmark in the board's own bold face with the O drawn as an
orbit — a ring, a body at its centre and a satellite on the ring. `orbit-lockup.svg` (and `.png`,
`-white.png`) carries the long name beneath it for brief covers and slides; `orbit-wordmark.svg` and
`orbit-mark.svg` are one colour (`currentColor`) for anything smaller; `orbit-favicon.svg` has its colours
baked in. The board itself carries the wordmark inline in its header and the mark as its favicon, so a saved
board needs no file beside it. `gen.py` regenerates the set.
