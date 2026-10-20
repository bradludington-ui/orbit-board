# ORBIT v2.00: handoff 4 to Codex (19 Oct 2026)

**From:** the lead on ORBIT v2.00 (Claude), for Brad to pass to Codex. Written 19 Oct 2026.
**Purpose:** small, independent batches that take work off our side while Claude's weekly usage is short. Each batch is
one Codex task and stands alone. Do **one batch at a time**; each ends in one report. Brad pastes the report back and the
lead decides what to adopt. When the report is written, **stop**: Brad sends the next batch when he is ready.

## Ground rules (Brad's standing rules; every batch)

1. **Read-only on our branches.** Do not push, commit, open a PR, or edit any branch of `bradludington-ui/orbit-board`.
   Work in your own sandbox. Return everything in the report, as text and as unified diffs against the base below.
2. **`tools/export-audit/mutate.mjs` is TEXT ONLY.** Never import, execute or run it, not even to count. Build a mutant
   board from its text with `recovery/v200/bin/mkmut.py`; count each entry's find with `recovery/v200/bin/mcount.py`.
   Run both with `python3 -I`. Do not run `npm run mutate` or `npm run validate:math`.
3. **Never run `playwright install`.** Use Chromium only if your sandbox already has it.
4. **The board file stays the empty template.** Synthetic data exists only at run time. Never return a populated board.
5. **Times are Eastern**, and never later than your clock.
6. **Expected values in tests are hand-written literals.** A new check must FAIL on the base and PASS on the fix. A check
   that guards behaviour the board already gets right is a CONTROL: it passes on the base and FAILS on the mutant its new
   mutation entry makes. Show both runs either way.
7. **Bound every run** (for example `timeout 900`). Record the command, the start time (ET), the exit code and the time
   taken.
8. **The can't-fails are data loss and money.** Every exportable product must be exactly right, and every word on screen
   must stay true.
9. **One batch at a time.** Do only the batch Brad sends, and do not widen it.
10. **Do not number ledger rows.** The ledger's highest row is U72 (plus the UI rows). Give each new finding a provisional
    id (`D2-1`, `D2-2`, … for batch D2, and so on); the lead assigns numbers.
11. **Run `audit-import` alone** (nothing else running) if you run it whole; focused blocks are fine at any time.
12. **Not these** (on our side or waiting on Brad): the hosted rebuild (the OCIO plan), U9 with U43, U9L, U24/U29/U31,
    U19H, U28, U51 (Brad chooses its option), and the after-merge mutation sweeps.

## Where things are

- **Base for every batch: `67bc4de`**, the head of PR #13 (branch `claude/orbit-v2.00`). It holds all of v2.00: the safety
  line `39cccb9`, the UI line `1398537`, and since the PR opened the left menu (`439716b`, `bcc49cd`), the 9 Section 508
  fixes (`91484f0`) and the records (`67bc4de`). This README is on `claude/v200-fixes-wip`; the code you review is at `67bc4de`.
- `NEXT-VERSION.md` (v2.00 entries) says what each fix does and what it does not cover.
  `recovery/v200/UNRESOLVED-LEDGER.md` has every row (U1–U72, UI rows) with its status and limits.
- How to run the checks: `npm install`, then `npm run check` and the suites in `package.json` (`audit:import`,
  `audit:recon`, `audit:board`, `audit:ui`, …). The browser tools need Chromium: `menus`, `keys`, `dropdowns`, `leftmenu`,
  `standards`, `layout`, `toolbar`, etc. A focused run of one block: the track's harness pattern in the suite's own file.

## Report format (every batch)

1. **FINDINGS**, most serious first. Each has: provisional id; exact steps from the empty template; observed vs expected,
   as literals; which board (`67bc4de`, or your patched copy); how bad: data loss, money, false words, or test gap only.
2. **Nothing found:** what you tried that held.
3. **Diffs** (only where the batch asks): unified, against `67bc4de`, with mcount on the result (every entry once).
4. **Runs:** command, start ET, exit, duration.

## The batches, smallest first

| id | kind | size | what |
|---|---|---|---|
| D1 | build hygiene | tiny | `package-lock.json` for the current `package.json` |
| D2 | review | small | the left-menu change: nothing lost, nothing doubled, no guard bypassed |
| D3 | review | small | locked views (U10) against the blockers and the new menu |
| D4 | review | medium | every export against the blockers (U37, U40, U44) |
| D5 | tests | small | two checks U44's round-7 reviews asked for and nobody wrote |
| D6 | tests | small | U37 test adequacy (its round-8 tests review was stopped) |
| F1 | fix | small | U72: Used by and ✕ beside U44's part (c) |
| F2 | fix | small | U60: the hold line and a browser-storage write under the hold |
| F3 | fix | small | U62: words |
| P1 | proposal | small | decoding Excel's `_xHHHH_` escapes at import (memo first, no code) |
| F4 | fix | tiny | D3-1: Install standard / Import ladder say they succeeded when a locked view refused them |

### D1. A lockfile (OCIO POA&M item P-05)

The repository has no `package-lock.json`, so dependency versions are not pinned (`playwright-core ^1.63.0`, `jsdom
^27.0.0`; installed today: playwright-core 1.63.0, jsdom 27.4.0; Node 22, npm 10). Produce `package-lock.json` for
`package.json` at `67bc4de` pinning exactly those installed versions (`npm install --package-lock-only` or equivalent).
In a fresh clone show: `npm ci` succeeds, `npm run check` passes, and one browser tool (`npm run chrome`) and one suite
(`npm run audit:ui`) pass. Return the lockfile in full and its sha256. Change nothing else.

### D2. Review the left-menu change (report only)

`439716b`..`bcc49cd` moved every top-right menu (Save, Reports & exports, Data, Setup, File) into the left menu, removed
four task-bar repeats, and added `tools/left-menu.mjs` (`npm run leftmenu`). The ledger's UI-MENU row and the
NEXT-VERSION menu entry describe the target. Compare `b71b18e` (before) with `67bc4de` (after). Look for:
(a) any action reachable at `b71b18e` that is no longer reachable, or is now reachable in two places (Save by button and
Ctrl+S is intended);
(b) any route that now skips a guard the old route had: a locked cycle's view (cycBlock and friends), a PMO copy
(SANDBOX: Save off, Submit input instead, Program offices hidden), the writer's pen, a save under way, the mixed-import
hold;
(c) help text or a message that names a place that no longer exists, or the wrong place;
(d) keyboard and folded-menu use; Section 508 (`npm run standards` must report 0 findings).
Report only.

### D3. Locked views against the blockers and the new menu (report only)

U10 (twelve commits, `df005ea`..`f6f4c26`) refuses, in a locked cycle's view, every edit that would change what an
export or the saved file carries. Since then U37 (`5d7b4a3`), U44 (`243ad9d`, `622f148`), U40 with F1 (`39cccb9`) and the
menu change landed, and none was reviewed against U10 together. With a locked cycle on screen, try every route those
changes added or rewired: destination lists put right (U44 "Put it right"), destinations kept apart or read by name (U40),
packages and returns, imports from the new Imports & exports and Data panels, Save and Save a copy, Live view pulls.
Expected: refused before anything is kept, with true words, and no export or saved file changes. Report only.

### D4. Exports against the blockers (report only)

Every export writer (`buildXlsx`, `buildPptx`, `flowPng`; the routes include the Funds Flow workbook, the ACE tie-out,
the Spend Plan Source, the FYDP Spend Plan, the IDS batch, the deck and the chart image) with:
(a) U37's refusal of a character XML 1.0 forbids (is every route refused before a byte, with the place named, and is
every allowed character still written?);
(b) U40 and U44 destination states (repeated keys put right, keys kept apart, destinations merged by name, a removed
destination): does every workbook show each requirement's money once, on the right destination, with sheet names that
name it?
Read the bytes of each file you export. Report only, with each money figure as a literal you worked out by hand.

### D5. Two U44 checks nobody wrote (tests only; CONTROLS)

From U44's round-7 reviews (described here in full):
(a) **money S1:** two of fix round 6's part-(h) lines are reached by no check: destFold's snapshot
`destOwnKey(x.k, destRepAt(x.k, n, DESTDB.gone, held))`, and flowDelEnt's removal record
`destRepAt(e.k, m, DESTDB.gone, L.map(function(y){ return y.k; }))`. Mutants that drop `held` in either one pass every
check. Write the three-board scenario that tells them apart: a destination list left with one key four times; the Full
Fund manager puts it right, removes two, and sends it back; the O&M manager puts R2 on one of them. Expected values are
literals worked out by hand.
(b) **tests SF2:** nothing checks destFold's snapshot use of `held`; it matters only with a third list (a second manager's
return of the same list, put right, before the consolidated board's own Put it right). Write that check.
Each is a CONTROL (rule 6), with one mutation entry each (`v200-u44-...`). Return the audit-recon diff and the mutate
text diff.

### D6. U37 test adequacy (tests only)

U37's round-8 tests review was stopped before it reported. Its round-7 additions are in. Find plausible wrong
versions of U37's change (`_xlsxRefused`, the deck and image paths, the cell naming past column Z, the U+007F–U+009F
allowance, the `_xHHHH_` refusal) that pass every check in U37's block at `67bc4de`. For each, give the mutant (as a
mutation entry) and a check that catches it, with literals. Tests and mutation text only.

### F1. U72 (fix)

Ledger U72: beside U44's part (c), `flowEntUseMap`'s `same` does not follow the key of its own another board gave an
entry. Used by is blank, and ✕ removes the destination without warning; the requirement comes back on a re-made
destination. Nothing is lost. Fix `same` so Used by and ✕'s question see that key. Write checks that fail on `67bc4de`
and pass on the fix, add mutation entries, and confirm U40's and U44's blocks and `npm run check` still pass.

### F2. U60 (fix)

Ledger U60: under the mixed-import hold, the stopped save writes browser storage before the hold stops it, and a status
line is false. The row describes the intended fix (the hold line before U18's `persist()`). Fix it, with checks
(fail before, pass after), mutation entries, and U18's and U4's blocks still passing.

### F3. U62 (fix, words)

Ledger U62 (low; words only). Make the words true, with a check and a mutation entry. No behaviour change.

### P1. Decoding `_xHHHH_` at import (proposal memo, no code)

Today the board's workbook reader keeps Excel's `_xHHHH_` escapes as written (for example `_x000D_` for a carriage
return), and U37 refuses to export them (Brad, 19 Oct: a named limit). Propose how imports should decode them so such
text exports again. Cover: where the reader keeps them (`xlsxRead` and its callers); which fields hold imported text; the
exact decode rule (Excel's own convention, including `_x005F_` for a literal underscore); what happens to a decoded
character XML 1.0 forbids (U37 still refuses it, and names it); the round trip of ORBIT's own workbooks; and the checks
and mutation entries a fix would need. One page. Brad decides before anything is built.

### F4. D3-1 (fix): a refused band remedy in a locked view says it succeeded

Found by D3 (Codex, 19 Oct; confirmed by the lead). In PB27's locked view, ⚙ Install standard (`bandStd`, about line
18836 at `3451746`) and Import ladder (`bandImport`, about line 18918) are refused by `save()`'s locked-view handling, but
then announce "⚖ Standard bands 0–4 installed on O&M" / "⚖ Ladder imported — 8 bands on O&M". Nothing is kept.
Fix them the way U10 fixed `bandCopyAll` (`if(cycBlock('Copying the band ladder')) return;`): refuse up front, before the
confirmation and before the file is read (`cycBlock('Installing the standard bands')`, `cycBlock('Importing a band
ladder')`, clearing the file input), so the only words are the refusal. Add checks in the U10 band-ladder block's helpers
and voice (fail at the base, pass on the fix): the status line after each, the ladder unchanged, no confirmation asked,
no file read. Add one mutation entry per guard, each caught. Base for this batch: **`3451746`** (PR #13's head after D2-1),
not `67bc4de`. mcount on the result; U10's and U37's blocks still pass.
