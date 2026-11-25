# v2.23 review RV-D — what a year with mandatory off says about mandatory money

Fixer RV-D, branch `v223-rvd`, from `56aa6c6`. The RULE (W3, item 159): `tiers()` draws no mandatory in a year where `S.mandOff` is
true. Four confirmed defects (D4, D5, D6, D11) were surfaces that still described mandatory money such a year does not have. Each was
reproduced on `56aa6c6` with the reviewer's and skeptic's probes (re-pointed at this worktree) before it was fixed.

## The one question, and the one way to say why not (slot `// ==== v2.23 review RV-D ====`)

- `mandLive()` = `mandOn() && !scenOn()`: can the walk on screen draw mandatory at all? False in a year with mandatory off (saved
  with the year) and under the ◨ discretionary-only view (a view, saved nowhere). Both leave every mandatory lane empty for the walk.
- `mandOffWhy()`: '' when live; "mandatory funding is off for FY27"; or "mandatory withheld, ◨ discretionary only".
- `mandLeftOf(T, i)` / `mandLeftTot(T)`: what is left in a mandatory lane (D6).
- `mandOffLeftNote()`, `planMandOffNote()`: the sentence a surface carries in an off year; '' in every year with mandatory on.
- `lanesLeftRow(T)`: the REMAINING (lanes) row of the PMO and cost element tables on screen, once (it was the same markup twice).

## D4 — the cutlines (the list, the money bar, the Rank board, one service)

`cutlinesOf()` draws no separate full-budget line where `!mandLive()`, and the discretionary line carries `off` (why). Reason: with
the walk's mandatory lanes empty nothing draws mandatory (natM is 0), so the first natM+natU row -- the discretionary line -- IS the
first natU row; the full-budget line would sit on the same row naming discretionary + a mandatory nobody can draw ($225 on the
probe board, against $150 that exists). One line that says "rows below are UNFUNDED for spent-out services (mandatory funding is off
for FY27)" reads truthfully on the list, and the money bar and the Rank board say the same from the same object ("· below it,
unfunded (…)", "; below it, unfunded (…)", Today: "discretionary runs out at #N and nothing pays below it (…)"). One service shown:
one line, "▼ USAF DISCRETIONARY EXHAUSTED — $120 BA — below this, USAF is UNFUNDED (…)", the second line suppressed.
`scenMand(i)` is 0 where `!mandOn()` too (the mandatory BA the view can DRAW): the fit chart's BA+M tick no longer marks a whole
budget past discretionary in an off year.

**◨ chose the same fix** (decided here; say if not): ◨ empties the mandatory lanes exactly as an off year does, and the list under ◨
said "rows below draw MANDATORY" and "FULL-BUDGET LIMIT — $225" directly beneath its own VIEWING banner saying mandatory is withheld.
The per-service banner had already adapted to ◨ (`scenOn()? 'DISCRETIONARY':'FULL BUDGET'`), so the board's own intent was clear.
`mandLive()` covers both; the VIEWING banner is unchanged.

## D5 — Plan B in a year with mandatory off ("off means off", the lead's decision; Brad may reverse)

- `planCompute()`: Plan B's topline is discretionary alone where `!mandOn()`.
- `planWant()`: every plan asks only for what was directed to discretionary where `!mandOn()`. **The topline alone was not enough**:
  a split directing $10 disc + $40 mand asked Plan B for $50, took USAF's last $20 from the requirement below and left it $0 -- the
  totals still tied (both $120) while the rows did not (B $40 short where the board says $50). The recon block holds the rows.
- So Plan B is Plan A, "What mandatory buys" is $0, and Plan B's unfunded is the board's TOTAL unfunded again (v1.83's tie), per
  requirement. Said on Plan B's card, the WHAT MANDATORY BUYS card, the Plan B tab's pot line, the A vs B tab (a note row) and the
  Two-Plan Forecast's Plan B subtitle (`planMandOffNote`). ◨ does not move the plans (the pot views never do): `mandOn()` only.
- Found on the way, the same defect: the proposed-order preview's **Full budget buys** (`edCompute`'s full walk and `fullBA`) walked
  discretionary + mandatory in an off year. Discretionary alone there now.

## D6 — Mand remaining: the reading chosen, and why

**Remaining = the whole BA in an off year (Mand BA stays the authority).** Not "Mand BA printed $0". Reasons:
- Mandatory budget authority is one quantity with one definition everywhere else: Budget Management, the PPBE position (the
  contract: "Mandatory budget authority stays in Budget Management and the PPBE position"), the posture's own off line ("its budget
  authority stays in Budget Management"), a lock's projection (`P.mand`), the cycle panel's pots, and the trace matrix's
  `mandBA = Σ mandSvc`. Printing $0 as Mand BA in an off year would give the same label a second meaning on four surfaces and
  disagree with every one of those.
- Nothing draws it, so all of it remains: BA − funded = remaining closes on every row, on and off.
- `tiers()`'s `mRem` is unchanged (natU and mDryA read it): it is the walk's own state, 0 for the year, never the lane's remainder.
- Every surface that prints it says why in an off year ("Mandatory funding is off for FY27: nothing draws the mandatory budget
  authority, so all of it is left in the lane (Mand Remaining = Mand BA).").
Surfaces: Funding Streams (per service and TOTAL, note row), the PMO Matrix and Cost Element sheets (`baBlock`, note row under the
block), the PMO and cost element tables on screen (`lanesLeftRow`, a hover note and "· mandatory off: its BA is all left"), the
Funding detail table (`svcSummary`, a hint line). Under ◨ the Funding detail still prints Mand BA and remaining $0, as it always has
(the view sets the pot aside); exports never follow ◨.
W3's RULE check label said "every mandatory lane is left whole" over an assertion that `mRem` is `[0,0]`: the label now says the walk's
lanes are empty, so nothing can draw from them (the assertion was right and is unchanged).

## D11 — Mission Critical

The posture tile ("unfunded of $70, even with mandatory") and the scorecard ("UNFUNDED even with mandatory") say "even with mandatory"
only where `mandLive()`; otherwise ", mandatory funding is off for FY27" / "— mandatory withheld, ◨ discretionary only".

## Checks (each fails on 56aa6c6 but its CONTROLs; shown run there)

- audit-board, RV-D slot, three blocks (fixture `RVDSC`, every expectation worked by hand in the comment):
  - "…a year with mandatory off (and the ◨ view) says rows go unfunded: the cutlines, the money bar, the Rank board, the Mission
    Critical tiles" -- the list's bands with the row each sits above, `cutlinesOf`, the money bar, the Rank board and its Today line,
    one service, the fit chart, both MC tiles, ◨; CONTROLs on a mandatory-on year.
  - "…Mand remaining is what is left of the mandatory BA…" -- the Funding detail, PMO and cost element tables, the walk untouched.
  - "…the Two Spend Plans panel’s Plan B is Plan A, and the proposed-order preview’s full budget is discretionary alone".
- audit-recon, RV-D slot: "…Plan B is Plan A and ties to TOTAL unfunded, and Mand Remaining is the BA (Two Spend Plans, Two-Plan
  Forecast, Funding Streams, PMO Matrix)" -- every workbook read back from its bytes, rows closing per service and TOTAL.
- audit-recon section 10 gains a sixth board shape, **a year with mandatory funding off** (a split directing mandatory, a
  requirement on the lane walk, a star): conservation, both unfunded readings, nothing negative, capacity, and the workbook's
  agreement. Coverage: passes on 56aa6c6 too (the identities held there; nothing reached this shape before).
- tools/trace-matrix.mjs: a second pass on the same fixture with mandatory off, every stated cell against an off-year truth from the
  fixture (mandatory lanes empty, the BA still the authority); a surface may fall silent there (the dashboard has no mandatory card),
  so silence is not scored, but Funding Streams must state Mand BA, Mand, TOTAL unfunded and beyond. 74 stated cells agree. Coverage
  too: it passes on 56aa6c6 (no surface the trace harvests carried one of these defects; they were sentences and Remaining columns).
  `trace-stated.json` is unchanged (the main pass is).

## Mutations

28 new (`v223-rvd-*`), none retired, none retargeted. `mcount`: 3,550 entries, each matching once. Proofs:
`recovery/v223/proofs-RVD.json` → `recovery/v223/proved-RVD.jsonl` (see the report for the verdicts).

## Run on the finished tree

- `npm run check`: all checks passed. `mcount`: 3,550 entries, each once.
- audit, audit-other, audit-recon: ALL CHECKS PASSED (whole, 8 GB heap, through heavy.sh).
- audit-board (whole): 4 FAILING CHECKS, none of them RV-D's and all present on `56aa6c6` itself (run there through a slim of the
  same two blocks: the same 4): "v2.22 W3 — the RECORD card … | bar" expects no **Open full page** on the card's bar (the integration
  added it, 3ace87b), and three in "v2.23 W1 — the requirement page … | tabs / a tab fails" expect no **Across the FYDP** tab (W2's,
  merged after W1's block was written). Left for the lead (not RV-D's functions). Every other block, the three RV-D ones and W3's
  relabelled RULE check included, passes. Two earlier runs died with exit 137 (the container: other fixers' suites beside it).
- `npm run trace`: every link holds, and 74 stated cells agree in the off-year pass. `coverage:money`: 19/19. `money-map --check`:
  current (no regeneration needed: no registered surface or cited anchor changed).
- Browser: `npm run alloc` ALL CHECKS PASSED; `npm run look` holds; `npm run standards` 0 findings, nothing new.
- Proofs: 28 of 28 CAUGHT by a failed check, none by a block that threw (`proved-RVD.jsonl`).
