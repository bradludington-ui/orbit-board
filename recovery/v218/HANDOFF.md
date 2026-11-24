# Handoff — 24 Nov 2026 (after v2.17)

Read CLAUDE.md, AGENTS.md and WORK-ASSIGNMENTS.md first. This file says where things stand and what is next.

## Where things stand

- **main is `1d88e3c`.** v2.16 (item 148) and v2.17 (items 149.1–149.6) merged together in PR #58 as `97aaac3`. The board's
  `BUILD` is `v2.17 (21 Nov 2026)`. PRs #59–#72 that followed are another session's APEX work (`apex/`, branch
  `ccr-fcf8998d-in8olt`); they do not touch the board file.
- **Nothing is in flight.** No open board branch, no workflow running, no gate running. `ccr-aef4e698-poiml3` was restarted
  from main for this handoff.
- **149.30 is answered** (Brad, 21 Nov: *"Linked one by one."*): a new year leads with Add requirement › From another year;
  the empty year's first offer opens it; Roll forward stays where it is; the wording fixes and the tick-all go ahead. It is
  built in v2.19, not v2.18.

## Brad's report of 23 Nov — answered, no change

His FYDP Spend Plan workbook (PSM tab) showed requirements on two lines with crossed figures (the GEX/GATES line carrying LM
Option Year's FY28 $2,560.209M) after he brought FY29's requirements in from FY28. Reproduced read-only in jsdom with his
flow (FY28: LM, IAC, GEX added; FY29 started empty; brought in From another year as GEX, IAC, LM):

- **v2.15** (`3486997`): GEX/GATES FY28 = $2,560,209,410, LM Option Year FY28 = $58,580. His photo.
- **v2.17** (main): one line each, each requirement's own figures in both years.

So it was item 148, already fixed. He was told: open the board in the v2.17 file and export again (his requirements already
carry the `prior` links the fix follows). Still possible on v2.17, and said: a real duplicate (a year rolled forward AND the
same work added again from the year before), and a cycle locked before v2.16 (its projection has no `custom`/`prior`, so a
requirement can be two lines there, never crossed figures). He also had Full Fund and Initial Spares untagged while O&M is
BES28 (the PPBE cycle bar's apply-to-all fixes that), and Full Fund's MATEC Proc Box and BCG appeared twice: likely the same
v2.15 defect; he was asked to send the tab if it persists on v2.17. The repro script is not in the repo (scratch only).

## Next: v2.18 = items 149.7–149.17 (waits for Brad's "go")

The order Brad accepted on 21 Nov: v2.18 = 149.7–149.17 (labels that print the wrong thing), v2.19 = 149.18–149.53 (clicks,
repeats, additions), v2.20 = item 133 (the Service share workbook). Each merges on Brad's word. The full text and Brad's
answers are in `NEXT-VERSION.md` › item 149; the review report is https://claude.ai/artifact/6ZTkCPLox7EPAk5pCtXrnr.
**No item in v2.18 changes how a figure is worked out**: 149.7 and 149.8 change which existing figure a label prints.

Where each one starts (line numbers on main `1d88e3c`; find by symbol):

| Item | What | Starts at |
|---|---|---|
| 149.7 | Row's "MC short" prints ask − disc − mand; must print the record's/`mcCalc()`'s ask − disc | `render()` exceptions, `_exc.push(['★','MC short '+fM(unfTotOf(it,t))` (~34920); use `mcShortSvcOf`/`mcCalc`, never recompute |
| 149.8 | Unfunded count and ◩ Any unfunded portion use `p.u` (beyond both lanes); must follow `unfTotOf` (ask − disc − mand) | the count under the Total UFR tile (`scoreboard()`/posture), `laneFilter==='unf'` (~35518, 35737) |
| 149.9 | Lane hover says "Unfunded $0" on short rows | the row's lane cell title in `render()`; print the record's Unfunded (`unfTotOf`) |
| 149.10 | "Go to FY27" opens another requirement | `priorHtml()` (~39122) button `switchYear(L.fy)`; open the named requirement (`setCur`), offer one click back |
| 149.11 | Grey line beside "Requirements" names the office chosen before | the page heading line; do with item 36 |
| 149.12 | Record's "Allocated" box shows d + m paid | RECORD panel money tiles in `inspectorBody()`; rename to Funded, no number changes |
| 149.13 | "Cumulative" is the running total of allocation | column header (~34831) and `render()`; rename and add a one-line hover |
| 149.14 | Edit box ↑/↓ walks outside the filtered list; record behind ≠ box after Save | `erStep()` (~39513) and the RECORD-panel follow (~39530); walk the list as shown |
| 149.15 | "every line follows the rule" under lines with no budget | `budRecordHtml()` (~18167, 18247); say how many lines have none |
| 149.16 | History omits added requirements; raw names ("recNames"); journal search types reversed; a NEW-n line under another year's NEW-n | the record's History/last-change, journal panel search box, journal filtering by `fy`; plain names through `FL()` |
| 149.17 | Help describes the pre-v2.00 layout; three messages send to Needs attention "at the top" | `<template id="helpDoc">`; Help is at its size limit (70,000 chars as audit-import reads it: the rewrite must come out shorter) |

Each fix gets a block in the suite that sees it (audit-board for the row and record, audit-other for the edit box and BAE
block, audit-import for the journal/Help size), failing on main first, and a `v218-*` mutation proved against it with
`recovery/v208/bin/prove.py` (text only; never import `mutate.mjs`). Check `mcount.py` after every edit. Grep the suites for any
wording a fix changes (149.12, 149.13, 149.17 rename things) before running them.

## How to build and gate (unchanged)

- Bump `BUILD` once. `npm run check` before every commit.
- Heavy suites one at a time with an 8 GB heap: `recovery/v215/bin/heavy.sh` (board, import, recon need it).
  `git fetch --unshallow` first in a fresh clone (recon and import read old builds from history).
- Browser checks not reached by `verify:grid` (it stops at layout's carried D ×8): run `keys`, `dropdowns`, `dialogs`,
  `leftmenu`, `menus`, `panels`, `pointer`, `standards` yourself; `row-controls --check` if a row control moves.
- The gate is `npm run validate:nightly` (every stage holds but layout's carried D ×8). No sweep without Brad naming one.
- Prove every new and retargeted mutation together on the final tree (`recovery/v215/proofs-v218.json`,
  `proved-v218.jsonl`, following v217's).
- Log results under NEXT-VERSION.md › Shipped › v2.18 and a CLAUDE.md section; update WORK-ASSIGNMENTS.md; push to
  `ccr-aef4e698-poiml3`; draft PR; merge only on Brad's word.
