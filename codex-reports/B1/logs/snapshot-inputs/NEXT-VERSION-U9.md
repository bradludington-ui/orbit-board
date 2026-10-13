- **U9 — the PMO split is exact, ties to the first office, and the same on every by-office view** (Brad, 12 Oct, about
  5:30 PM ET: "Don't wait for me. Let's keep pressing throughout to get this next version published."; the lead set U9 among
  the release blockers to fix). A CLIN-split prime (PRIME-3) is shared, service by service, across the offices that own its
  CLINs. Per service, the requirement's ask is first split among the offices, and then each lane (discretionary, mandatory,
  unfunded) is split by what each office still has to take (the v1.95 rule). The first split went by each office's FRACTION
  of the service (its CLINs' asks over all the CLINs' asks, divided in floating point), and 1/6, 2/6 and 3/6 are not exactly
  1 : 2 : 3: a tie went to the last office and a near tie could go to the wrong one. $3 at 1 : 2 : 3 (MxS, AV, TSS), drawn
  from one lane, was $0/$1/$2 on the PMO funding panel, the forecast, the PMO Matrix and every other by-office view, where
  exact largest remainder and the CLIN source workbook (the Spend Plan Source) give $1/$1/$1; $9 was $1/$3/$5, not
  $2/$3/$4. The totals balanced, so nothing called it. Now the ask is split among the offices by their own CLIN asks (an
  office's CLINs added up), exactly, with `apportion()` -- the board's one spreading rule, and the one the Spend Plan Source
  splits a prime's CLINs by: floor every share, then a dollar each to the largest remainders, EQUAL REMAINDERS TO THE OFFICE
  WHOSE FIRST CLIN COMES FIRST IN THE CLIN LIST. Each lane is then split as before. A service no CLIN covers stays with the
  requirement's own office, and an amount that is not whole dollars (a modelled plan's) is still each office's fraction of
  it, both as before.
  - **What users may see:** on a CLIN-split prime, a dollar can move from one office to another where the offices' shares
    tie or nearly tie ($3 at 1 : 2 : 3 drawn from one lane is now $1/$1/$1). Every by-office view moves together, in every
    column that carries an office's part (discretionary, mandatory, unfunded and the ★ MC figures): the PMO funding panel,
    the forecast and its export, the Two-Plan Forecast's BY PMO rows, the PMO Matrix, the CE by PMO sheet, each office's PMO
    tab, the CR view by PMO and the deck's Funding by PMO slide. An office whose share was $0 now has its PMO tab, and one
    whose only dollar moves to another office no longer gets one: $4 over CLINs asking 3 : 6 : 1 was MxS $1 / AV $2 / TSS $1
    and is now $1 / $3 / $0, as the Spend Plan Source's CLIN lines already were, so no PMO TSS tab is written. An office's
    own totals move by the dollars that moved; no requirement, service or board total changes.
  - **Test:** audit-recon "v2.00 (U9) — the PMO split is exact, ties to the first office, and the same on the panel, the
    forecast and the PMO Matrix" (65 checks) and "v2.00 (U9, every export) — CE by PMO, the PMO tabs by portion, the
    Two-Plan Forecast and the deck carry the same parts; an office with two CLINs" (24 checks), every expected dollar a
    hand-written literal: $3 at 1 : 2 : 3 and $9 (the review's), $999,999,999 (a tie at budget size), $250,000,000 over
    weights a remainder apart (not a tie), $3 over four offices at 1 : 1 : 1 : 3, $3 with one office's share zero, and a
    service no CLIN covers; a board whose CLIN list puts TSS first, so a tie goes to TSS where the office list and the
    alphabet would not, with mandatory and unfunded dollars and a starred requirement; a modelled plan's $10.50 kept to the
    cent; a $3 tie on the mandatory lane alone; an office holding two CLINs, which weighs them added up and ranks by the
    first; a starred requirement drawn from both lanes and short, at 1 : 2 : 3, whose unfunded and ★ figures are not shared
    evenly; and an exact tie at $779,153,421 over CLIN asks in the hundreds of millions, which weights rebuilt from the
    fractions get wrong. Boards A and B (the review's cases, the large values, four offices, the zero share, the uncovered
    service, the TSS-first list) are read on the PMO funding panel as drawn, the forecast (each service alone, the whole
    portfolio and the exported view), the PMO Matrix, each office's PMO tab (its report row) and the CR view by PMO; board C
    (the modelled plan) on each office's part and the forecast, as controls, since those figures do not move; board D ($3,
    $9 and the mandatory-lane tie) on the PMO Matrix, the CE by PMO sheet, each PMO tab's Disc and Mand rows by portion, the
    Two-Plan Forecast's BY PMO rows (both plans) and the deck's Funding by PMO; board E (two CLINs) on the PMO Matrix and
    the forecast; board F (starred, both lanes, short) on each PMO tab's MC memo and Unfunded rows, the CE by PMO sheet's ★
    and Unfunded columns, the deck's Unfunded and ★ columns, the PMO Matrix's totals and ★ columns and the panel; board G
    (the budget-size tie) on the PMO Matrix and the forecast. Each is read from the workbook's bytes, the deck's tables or
    the board, with the Spend Plan Source's CLIN lines as a control. 51 checks fail on the board before the change; every
    control (38) passes on both.
  - **Mutations:** `v200-u9-split-by-fraction`, `-weights-are-fractions`, `-per-part-rounding`, `-ties-by-name`,
    `-uncovered-weight-dropped`, `-plan-part-by-weight`, `-plan-placed-by-weight`, `-cebypmo-float-split`,
    `-cebypmo-own-rounding`, `-tab-portions-float-split`, `-deck-rollup-float-split`, `-deck-own-rounding`,
    `-weights-first-clin`, `-office-ranks-by-last-clin`, `-tab-memo-float-split`, `-tab-unf-float-split`,
    `-deck-mc-float-split`, `-cebypmo-mcs-float-split`, `-matrix-mcs-own-rounding`, `-panel-mc-own-rounding` and
    `-weights-frac-times-tot`; each caught by the focused blocks (51, 51, 42, 13, 9, 1, 1, 2, 1, 3, 2, 1, 2, 2, 1, 1, 1, 1,
    1, 1 and 2 failing; full-suite sensitivity runs in the final-tree queue).
  - **Not covered:** the by-office split and the Spend Plan Source now use the same exact rule but not the same amounts. The
    Spend Plan Source splits each lane, and each dated line, by CLIN on its own, from the CLIN list and grid as edited on the
    board; the by-office split takes each office's share of the ask first and then splits each lane by what each office
    still has to take, from the CLINs as shipped. So the Spend Plan Source's CLIN lines, added up by office, can differ from
    an office's part: where a service draws from both lanes, even in full ($6 at 1 : 2 : 3 drawn $3 discretionary + $3
    mandatory: offices MxS 1 + 0, AV 1 + 1, TSS 1 + 2; CLIN lines $2 each, $1 a lane, so CLIN 0010, which asks $1, carries
    $2), where an office holds two CLINs, where a service is only part funded, where a CLIN was added on the board, or where
    an award comes in increments. Measured on the boards before and after this change, the same on both; not changed here,
    and listed for Brad in the ledger: which figure is an office's money where they differ.
