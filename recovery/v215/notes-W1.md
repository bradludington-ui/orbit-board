# v2.15 W1 — the PPBE cycle: the bar, packages, retag (items 137, 138, 139; item 146's E2 line)

Builder W1, branch `v215-w1` from the slot commit `8c24ea2`. Brad's go of 3 Nov 2026; the contract is `recovery/v215/contract.md` §1.1.

## What was built

### 137 — the context bar never wraps (`fitTop`, `cycBarSync`, `cycFitShort`, `cycMenuHtml`, `statSync`'s count, the edit chip)
- `fitTop()` measures the bar and takes steps, each only while the bar still does not fit (never a breakpoint):
  1. `tight1` — the labels go (as before);
  2. `cyc1` — the figure shortens: `cycFitShort(F, named)` drops "FY27 ·" and writes "unallocated" / "over" as signs
     (`$12.33B · ⚠ $6.9M`); the cycle it is against is kept where the bar names another (Mixed, a lock's);
  3. `cyc2` — the figure leaves the bar (`.hdr.cyc2 #cycFit{display:none}`) for the head of the PPBE cycle's list
     (`.cycfit-in`, an `mi()` item that opens Fit to the PPBE position, the whole sentence); the PPBE cycle carries a red ⚠
     (`#b_cyc.fover::before`) while anything is over, and its tooltip names the over;
  4. `tight3` — (measured as needed at 761–960px with Mixed and its warning unread) Help shows its icon alone, "⚠ 1 unread"
     reads "⚠ 1" (`#statKeep .ku`) and the plain "✎ Editable" chip reads ✎ (`#uiEdChip .ek`); accessible names unchanged;
  5. `tight2` — wrap, only where all of that still does not fit (the phone layout, ≤760px, where the media query also wraps it).
- `cycBarSync` writes both lengths on `#cycFit` (`data-l`, `data-s`); the tooltip leads with the whole sentence. It now runs
  before `cycMenuHtml` in `syncBtns`, so the list can carry the figure.
- The ≤1100px media query no longer wraps `.hdr`; ≤760px does.
- Measured (Chromium, populated board, BES28 controls unallocated and over; Mixed with Full Fund on PB27 and the opening's warning
  unread; this font and the Segoe stand-in; 1920 … 761): one line, 44px, at every width; the steps taken are printed by layout S.

### 138 — an incoming plan comes in under the receiving board's cycle (`cycInFor`, `cycInTake`, `cycInSay`)
- `cycInFor(cur, A)`: the identified cycle — the appropriation's own tag on this board; else the bar's one cycle (never Mixed);
  else untagged. Its deltas reference is this board's own. `whole` (taken as made, as before) only when the board holds
  nothing: no appropriation tagged or holding a requirement, none unreadable, and no plan for this appropriation.
- `cycInTake(cur, inc, I)`: a shallow copy of the incoming plan with this board's tag and reference, and of the positions this
  board's own, plus the identified cycle's from the package where it carries one. `T.left` names the positions the package
  carries for another cycle that this board does not already hold as they are.
- `cycInSay(T, html)`: "Made under PB27, taken under BES28. Its PB27 and POM28 positions were not taken; its BES28 position was
  taken. Its deltas reference (POM27) was not taken: deltas stay read against PB27." ('' when it comes in as made.)
- Wired into `pkgApply` (the conflict list, the preview — "PPBE cycle: …" — the write and the result), `consTakeApply` (the bar
  read once before any pick; per pick the preview, the write and the result, named by appropriation) and `importBoards`
  (settled before anything is written, so storage, `PUBS` and the board on screen hold the plan as taken; the result names it).
- Not changed: a full import, a PMO submittal, `cycTake` (locked cycles: taken as today).

### 139 — retag moves every appropriation that has locked the cycle (`cycRetagPlan`, `cycRetagLbl`, `cycRetagGo`)
- `cycRetagPlan(from, to)` reads `cycOverview()`: `on` = every appropriation holding a plan tagged `from`; `move` = those whose
  `from` lock is locked (not reopened: `cycCellOf`); `left` = the rest of `on`. An untagged board (`from` '') moves alone.
- `cycRetagGo(from, to)` writes through `cycApplyAll(to, {only, from, left})`: the bar's writer (read again after the question,
  one `lsAll`, a `(cycle)` journal line each, its skips), the question titled "Retag 2 appropriations as BES28?", each one left
  named "NOT retagged: has not locked PB27: lock it on its own board, then retag", and the line "Initial Spares and OPN have not
  locked PB27: lock each on its own board, then retag." A PMO copy and a locked view refuse, as before.
- The three buttons — 🏷 Retag it as … after a lock, 🏷 Retag as … in PPBE cycles (`cycRetagNext`), Retag … as … under Locks by
  appropriation and in the opening offer (`cycRetagLead`) — say how many: "Retag 2 of 4 as BES28" (one appropriation alone keeps
  its own words).
- `cycLock` refuses a plan tagged with another cycle, naming both and the way out: "Not locked — O&M’s plan is on BES28, so it
  cannot be locked as PB27: … Tag this board PB27 under PPBE cycles (Working plan is tagged), lock, then retag." In a PMO copy:
  "This PMO copy reads PB27, as the portfolio team published it: lock PB27 here." An untagged plan is still tagged by its lock.

### 146 — E2's own-appropriation line
- `cycTake` prefixes the board's own line with its appropriation: "O&M: 1 locked PPBE cycle came across (PB27)." (and the "⚠ …
  differs … left alone" line likewise).

## Decided in the build (Brad can reverse each)
1. **cycApplyAll gained an optional second argument** (`opt = {only, from, left}`) — the retag's restriction. With no `opt` it
   is byte-for-byte the bar's behaviour. This is the lead's function (contract §2); see *For the integration*.
2. **An untagged board's retag** (Retag … as … beside the calendar, when this board is untagged) moves the board on screen alone:
   nothing is locked on "no cycle", so there is nothing to wait for.
3. **"Retag N of M"**: M is the appropriations holding a plan on the cycle being left (the board on screen included); one alone keeps
   the old words ("Retag it as BES28", "Retag O&M as BES28").
4. **The context bar's fourth step** (Help's icon alone, "⚠ 1", "✎") is beyond the item's three: measured necessary to hold one
   line at 761–960px with Mixed and an unread warning. A chip that says more (a PMO copy, who holds the pen, read only) keeps its
   words; with one of those the bar can still wrap at the narrowest widths (not measured).
5. **The short figure keeps the cycle's name** where the bar names another (Mixed): "BES28 · $12.33B · ⚠ $6.9M".
6. **The figure's copy in the list is always drawn, shown only when moved** (CSS), so a list opened after a resize is right without a
   redraw. The v2.13 menu check counts choices without it (`:not(.cycfit-mi)`).
7. **138's deltas reference** is always this board's own (none where it has none), never the package's, even where the package's
   names a lock that came with it (consTakeApply's `cycTake`).
8. **138's "not taken"** names only positions this board does not already hold as they are (a POM28 identical on both sides is not
   said).
9. **138's "the cycle the bar shows"** is read literally: an untagged appropriation that holds requirements makes the bar Mixed, so
   it stays untagged.
10. **No `(cycle)` journal line for a take**: the appropriation's tag on this board does not change (except untagged → the bar's
   cycle, which is said in the result instead). A line in the incoming journal would read as this board's change against a later
   return (`pkgMineSince`).
11. **importBoards has no preview of the contents**, so only its result says what was not taken.
12. **Lock in a PMO copy** refuses another cycle too (the copy cannot be retagged; the way out is to lock the copy's own cycle).

## Checks
New, each fails on the slot commit `8c24ea2` unless labelled CONTROL (each block run on the slot board; output kept in the session):
- audit-board "v2.15 W1 — the retag moves every appropriation that has locked the cycle, and Lock refuses a plan on another cycle
  (item 139)": the lock's button and PPBE cycles' ("Retag 2 of 4 as BES28"); Cancel changes nothing; the question; OK moves O&M and
  Full Fund with their journal lines, Initial Spares and OPN byte for byte; the line; Locks by appropriation ("Retag 2 of 3"), and the
  opening offer; Lock refused on a plan on BES28 with its line; a PMO copy's lock of another cycle refused. CONTROLs: the fixture,
  the reference kept, one appropriation alone, a PB27 plan locks PB27, an untagged plan is tagged by its lock, a PMO copy refuses the
  retag, a locked view refuses it.
- audit-board "v2.15 W1 — the context bar gives the PPBE cycle’s figure less room in steps, never wrapping first (item 137)": both
  lengths and the tooltip; fitTop's five steps in order with stand-in widths, and back; the list's figure at its head opening Fit;
  the ⚠ mark and tooltip. CONTROL: no mark with nothing over.
- audit-import "v2.15 W1 — an incoming plan comes in under the receiving board’s PPBE cycle, with only that cycle’s position (item
  138)": a package for Full Fund (storage and PUBS, preview, result), save and reopen, the board on screen (O&M) and its reopen,
  one appropriation from a consolidated file, several boards at once, an untagged appropriation under the bar's BES28, a Mixed board.
  CONTROLs: the fixture, Mixed, a board holding nothing takes it whole, a package made under the board's own cycle.
- audit-import "v2.15 W1 — E2’s line for the board’s own locked cycles names the appropriation (item 146)". CONTROLs: the file
  carries O&M's locks; Full Fund's line.
- layout-fits S: now holds the context bar to one line at every width (1920–761, both fonts) with the warning unread; when the figure
  has moved, the list carries it at its head, whole, and the PPBE cycle draws its ⚠.
- toolbar-fits: a second pass on a tagged board (Mixed, unallocated and over, a warning unread): the context bar one line at every
  width, every control usable.
- keyboard-reach V2: at 1024 the figure is in the list; Tab reaches the PPBE cycle, Enter opens the list, the first Tab is the
  figure, Enter opens Fit with the keyboard inside, Esc back on the PPBE cycle.

Existing checks changed on purpose (each with a `// v2.15 W1` comment):
- audit-board v2.02 (U51), "PPBE cycles — a PMO copy carries the reference projection only", v2.12 W3 "a lock keeps the position",
  v2.12 RV3 "a lock that tags the plan" (its tagged CONTROL), v2.12 RV6 S06, v2.13 (the two locked views): each locked a second cycle
  on a plan tagged with another; Lock now refuses that, so each fixture tags the plan first, or (for a lock taken before v2.15 /
  v2.12, which files still carry) builds that lock as the earlier build wrote it (`OLD_LOCK`).
- audit-board v2.13 "the menu": counts choices without the figure's copy (`:not(.cycfit-mi)`).
- tools/trace-lib.mjs: the scratch lock (verify-file's `POM|2999`, and any lock of a cycle other than the plan's) is taken under the
  plan's own position for the moment and the tag put back — otherwise `verify:file` refused to lock on every tagged board.

## Mutations
39 new (`v215-w1-*`), 3 retargeted (`retag-drops-reference`, `v203-19-flag-never`, `v213-rv-headline-every`), none retired.
Proved with `recovery/v208/bin/prove.py` (`proofs-W1.json` → `proved-W1.jsonl`), JOBS=1 under heavy.sh: **42 of 42 CAUGHT**
(`v215-w1-fit-list-missing` was caught by two failed checks and its block then threw on the missing item; every other with no throw).
The CSS steps (`.hdr.cyc2 #cycFit`, the ⚠, `.hdr.tight3 …`) have no jsdom mutation (the sweep could not see them); the browser
checks hold them, proved by hand on the slot board (`8c24ea2`, which has none of it): layout S FAILS there, toolbar-fits' tagged pass
FAILS (10 widths wrap below 1100), and keys V2 FAILS (the figure never leaves the bar; the list's first item is a cycle).

## Older checks and fixtures that lock on a plan tagged with another cycle
Lock's refusal (139) meets every fixture that locks a second cycle on one plan. Each was changed on purpose with a `// v2.15 W1` (or
`/* v2.15 W1 */`) comment: in audit-board by tagging the plan first or `OLD_LOCK` (v2.13 block); in audit-recon ("comparing two
cycles", "v1.95 — the cycle comparison files…", "v2.00 (U32, U33)"), audit-import (the v1.85 frame fixtures, "v1.86 — the four lists…",
"v1.86 — one appropriation out…", the U40 destination fixtures) and audit-other ("v2.10 A") by `w1LockAsBefore()` -- a hoisted
function in each suite's W1 slot that takes the lock as v2.14 did (under the lock's key with the plan's own position, then the tag put
back and the record set as v2.14 wrote it; plain `cycLock()` where the plan is untagged or on that cycle). These fixtures stand for
locks files already carry; none of them tests the lock itself.

## For the integration
- **`cycApplyAll(key, opt)`** — W1 added the optional `opt` (the retag's `only`/`from`/`left`, the question's title, the leave lines,
  the result) because item 139 says the retag writes "through cycApplyAll's writer"; the contract makes the function the lead's.
  With no `opt` nothing changes. Review and keep, or move the restriction where you prefer.
- **The guide**: no text added (W4 measures the guide's 70,000 budget). Proposed for `cyc-ap`: "A lock takes the cycle the plan is
  on: a plan tagged with another is refused until it is tagged with the one being locked. Each retag button moves every appropriation
  that has locked the cycle being left, and names those that have not." And for the package/import text: "A package or a board taken
  for one appropriation comes in under the cycle this board has for it, with only that cycle's PPBE position."
- `statSync` writes "⚠ N unread" with `innerHTML` (a span for the fourth step); W3's message work should keep the span.

## npm script to add
None.

## Known gaps
- consTakeApply's result line (all of it, as before) is said before the page reopens and is lost with it; its preview carries the
  sentence.
- The fourth step is measured with the plain edit chip; a PMO copy's or another pen-holder's chip is longer and was not measured.
- No check drives a package's *conflict* list with a cycle difference (it now reads the plan as it will be taken).
