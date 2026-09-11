# SPMT — Sustainment Portfolio Management Tool

A prioritization board for building and defending a sustainment budget: rank requirements, see what
the money covers, move funding between services and years, reconcile against execution data, and
produce the workbooks and briefing slides the review boards expect.

The whole application is **one HTML file**. No install, no server, no build step, no dependencies of
any kind — not a single script, stylesheet, or font is loaded from anywhere. Open
`prioritization-board.html` in a browser and it runs, including from a shared drive or a `file://`
path on a machine with no route to the internet.

Current build: **v1.23 (11 Sep 2026)** · ~19,500 lines · 2.8 MB.

## Getting started

1. Open `prioritization-board.html`.
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
| `prioritization-board.html` | The application. This is the source of truth. |
| `CLAUDE.md` | How to work on it — read this before editing. |
| `tools/check.mjs` | Invariant checks. Run before every commit. |

```
node tools/check.mjs
```

Verifies that the script parses, the appropriation tables agree across all six places they are
declared, the save path still works, no board data has been committed, and nothing external is
referenced.

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
