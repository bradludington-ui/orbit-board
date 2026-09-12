# SPMT — Sustainment Portfolio Management Tool

A prioritization board for building and defending a sustainment budget: rank requirements, see what
the money covers, move funding between services and years, reconcile against execution data, and
produce the workbooks and briefing slides the review boards expect.

The whole application is **one HTML file**. No install, no server, no build step, no dependencies of
any kind — not a single script, stylesheet, or font is loaded from anywhere. Open it in a browser
and it runs, including from a shared drive or a `file://` path on a machine with no route to the
internet.

Current build: **v1.32 (12 Sep 2026)** · ~19,500 lines · 2.8 MB.

## Two looks, one application

| File | Look |
|---|---|
| `prioritization-board.html` | **Cards** — one panel per requirement. The original. |
| `prioritization-board-grid.html` | **Grid** — a dense table with a docked record inspector. |

Same application, same numbers, same exports; only the presentation differs, and a parity check in
CI-style tooling keeps it that way. Pick whichever reads better for you. To move a board between
them, use **📁 File → ⬅ Import a previous board…** and select the other file — import already reads
another board's `.html` and lifts its state out. They also share browser storage, so an unsaved
draft shows up in whichever one you open.

## Getting started

1. Open `prioritization-board.html` (cards) or `prioritization-board-grid.html` (grid).
2. It opens as an empty **shell** — the program with no data in it.
3. Use **📁 File → ⬅ Import a previous board…** and pick your saved board file. Requirements,
   budgets, every fiscal year, PPBE positions and logs all load from it.
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
reporting, SPMT-vs-CCaR reconciliation, obligation performance against OSD goals, and funds-flow
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
| `prioritization-board.html` | The application, card layout. Source of truth. |
| `prioritization-board-grid.html` | The same application, grid layout. |
| `CLAUDE.md` | How to work on it — read this before editing. |
| `tools/check.mjs` | Invariant checks for one build. |
| `tools/parity.mjs` | Proves the two builds have not diverged. |
| `tools/row-controls.mjs` | Lists every control on a requirement row; diffs two builds. |
| `tools/export-audit/` | Drives the real exports in jsdom and checks every printed figure. |

```
npm run check
```

Runs the invariant checks over **both** builds and then the parity check. The invariants verify that
the script parses, the appropriation tables agree across all six places they are declared, the save
path still works, no board data has been committed, and nothing external is referenced.

Parity extracts every top-level function from both files and diffs them by name. Anything that
differs must be listed in `tools/parity-allow.json` with a reason, so divergence between the two
looks is a deliberate, reviewed act rather than something discovered months later in a briefing.

```
node tools/row-controls.mjs --diff prioritization-board.html prioritization-board-grid.html
```

Enumerates every interactive control on a requirement row from the rendered page and compares the
two builds, so "the grid keeps everything the cards had" is measured rather than assumed.

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
