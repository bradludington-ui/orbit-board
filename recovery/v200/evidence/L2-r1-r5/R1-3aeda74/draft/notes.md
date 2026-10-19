- **R1 — the funds flow decides executed or planned by appropriation and EFFECTIVE fiscal year** (Codex review of `main`
  `f9b4413`; fix approved by Brad on 11 Oct). **What was wrong:** whether a year was executed or planned was decided by
  the year the CCaR workbook files a row under. The flow, though, counts each row in its effective year: with the OBBBA
  rule on, an FY25 O&M row whose Budget cell says OBBBA or Mandatory counts as FY26. Take a board whose only FY25 O&M row
  is a $100M OBBBA one. FY26 had no rows filed under it, so it was read as planned, and its $500M plan was counted beside
  the $100M carried into it: $600M. FY25 counted as executed with nothing left in it: $0. The panel called FY26
  "PLANNED, not executed" while it held executed money, and the export's TOTAL FUNDING read 600000000.
  **The fix:**
  - `flowExecYears(sl, raw)` decides executed years by effective year (`flowEffFy`). A year with execution counted in it
    is read from that execution and never also from its plan. A year left with no execution is a planned year.
  - The year buttons still offer the workbook's own years (`raw`). Without that, a saved FY25-only selection whose rows
    all count as FY26 would silently become all years. It stays FY25.
  - A total that holds planned and executed money is now said whenever the years in scope differ in kind, not only when
    one year holds both (v1.99, item 93). The panel says "Planned and executed money in one total" and the export adds
    "NOTE: planned and executed money in one total". Both use the same test (`flowIsMixed`) and the same wording, one
    line per year in scope (`flowMixLines`).
  - The matching rules no longer claim "select both years and the total is unchanged". They now say each row is counted
    once, in its effective year, and execution is never also read from the plan, so switching the rule on can change a
    two-year total.
  - Raw execution history (`EXDB.all`) is read, never rewritten.

  **The two approved cases:**
  - **Variant B** (FY25 plan $300M, FY26 plan $500M, one $100M FY25 OBBBA row): FY25 reads its $300M plan. FY26 reads
    $100M executed and $0 planned. Together they are $400M: $100M executed and $300M planned, labelled as both. The
    export shows US SERVICE FUNDING 400000000 and the planned-and-executed NOTE.
  - **Variant A** (the same plus a $40M ordinary FY25 row): FY25 = $40M executed and FY26 = $100M executed. Together
    they are $140M, all executed. The export agrees and carries no such NOTE.

  **What users may see:**
  - With the OBBBA rule on, FY26 O&M no longer adds its plan to the carried execution.
  - An FY25 whose rows all count as FY26 is marked "plan" and reads FY25's own plan. A two-year total changes to match
    (Variant B: $600M became $400M).
  - Any export whose years mix planned and executed money gains the NOTE, with a line per year in scope. That includes
    the everyday ALL YEARS view: FY25 executed, the later years planned.

  **Test:** `audit-recon.mjs`, scenario "v2.00 (R1) — execution precedence by appropriation and effective year", 19
  checks. The expected figures are the fixture's own arithmetic. The scenario covers:
  - both variants, one year at a time and both together;
  - the panel's mixed-total note, its year buttons and its planned-year note;
  - the export's Scope, US SERVICE FUNDING, O&M, TOTAL FUNDING and NOTE;
  - an FY25-only selection, saved and reopened;
  - raw history before and after;
  - the matching-rules wording.

  On `9b27e80`, 15 of the 19 checks fail. The two CONTROLs and the two raw-history guards pass. The review's
  `money-runtime-probe.mjs` goes from 10/13 to 13/13.

  **Mutations** (all in `audit-recon`): `v200-r1-raw-year-exec`, `v200-r1-saved-year-widens`,
  `v200-r1-mixed-disclosure-b`, `v200-r1-export-note` and `v200-r1-help-claim`. There are two new ones:
  `v200-r1-scan-stops-early` (the year scan stops too soon) and `v200-r1-mix-words-one-kind` (a year of one kind is
  written as both). Each applies exactly once and is caught by the R1 scenario. Every existing mutation still applies
  exactly once.

  **Limits:**
  - `flowExecYears` now reads rows rather than counting them. It stops once a year's two possible years are both
    marked, newest year first. On 8,000-row synthetic sets a panel draw is as fast as before, except when every FY25 row
    of an appropriation moves. That case takes about twice as long (jsdom: 0.30 s → 0.66 s a draw).
  - The FY25 year button's tooltip still says FY25 "has no O&M execution imported" when its rows were imported and all
    count as FY26. The planned-year note likewise says "nothing in scope has executed in that year yet". That wording is
    unchanged.
  - A year that only carried rows count in, outside the plan window and with no rows of its own, is still not offered
    as a year button. This is unchanged from before.
  - An FY25 that the board has no state for reads $0 planned ("a year nobody has planned holds no money"). This is
    unchanged.
