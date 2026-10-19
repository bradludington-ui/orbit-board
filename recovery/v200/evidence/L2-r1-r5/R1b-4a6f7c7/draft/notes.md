<!-- Addition to NEXT-VERSION.md, R1 entry ("R1 — the funds flow decides executed or planned by appropriation and EFFECTIVE
     fiscal year"). Insert after its **Limits** list, before the R2 entry. Also delete the first Limits bullet ("The FY25 year
     button's tooltip still says FY25 "has no O&M execution imported" ... That wording is unchanged."): it no longer holds.
     Draft built on e635775; the commit SHA is filled in when it is integrated. -->

  **Brad's decisions on R1 (11 Oct 2026), as built.** Brad's words: "For R1, keep the mixed-funding export NOTE whenever the
  selected total includes both executed and planned money, including all-years views. Replace any contradictory whole-total
  'PLANNED, not executed' box with accurate executed/planned amounts. Make the tooltip distinguish stored FY25 rows from their
  effective FY26 treatment."
  - **The money in the total decides the planned-and-executed note.** `flowIsMixed` now asks whether the selected total holds
    executed dollars and planned dollars (`F.execV` and `F.planV`, the figures the total is made of). Before, it asked whether
    the years in scope differ in kind. The panel's "Planned and executed money in one total" box and the export's "NOTE:
    planned and executed money in one total" both use this test, in every scope, including ALL YEARS.
    - Kept: an ALL YEARS view with FY25 executed ($40M) and FY26 planned ($500M) carries the NOTE and the box, with a line per
      year.
    - No longer said: a planned year holding $0 does not make a total mixed. An ALL YEARS view of $140M executed, beside FY27–FY30
      that hold no plan, carries no NOTE and no box. Neither does FY26 + FY27 ($100M executed, FY27 $0).
    - A dollar counts as money at $0.005 or more either way, so execution that nets below zero still counts as executed money.
  - **No "PLANNED, not executed" beside executed money.** The planned-year note's headline says "FYxx is PLANNED, not executed"
    only when the total holds no executed money. When the total holds executed money, the headline gives both amounts, then
    names the planned years. Variant B, FY25 + FY26: "This total holds $100.00M executed and $300.00M planned. FY25 is a planned
    year." FY25 alone ($300M, all planned) still says "FY25 is PLANNED, not executed."
    - The sentence "This scope mixes the two: $X executed, $Y planned" is removed. It was decided by year kind, so it also
      appeared over $140.00M executed and $0.00M planned.
    - Nothing else on the panel calls the whole total planned while it holds executed money. The scope label's "PLANNED (board
      allocation, …)" appears only when no year in scope has execution counted in it. Its total then holds no executed money.
      It is unchanged.
  - **Rows stored under a year are told apart from the year they count in.** Say a planned year has rows stored under it, all
    counted in a later year by the OBBBA rule. The panel now says so.
    - The FY25 year button read "FY2025 has no O&M execution imported". It now reads: "FY2025: the O&M rows imported for it are
      stored under FY2025 and counted in FY2026 (OBBBA), so FY2025 O&M is read from its plan — this board’s own allocation".
    - The planned-year note read "Nothing in scope has executed in that year yet". It now reads: "The rows stored under FY25 are
      counted in FY26 (OBBBA), so the chart reads O&M’s own allocation for it".
    - `flowStoredIn(fy, aps)` reads the workbook's own years (`flowExecYears(a, true)`).
    - A year with no rows stored under it keeps its old wording.
  - **Test:** `audit-recon.mjs`, scenario "v2.00 (R1) — mixed totals are said with their amounts, and stored rows apart from
    their effective year", 17 checks. Every expected value is the fixture's own arithmetic. On `e635775`, 8 of them fail. The
    other 9 pass there: 7 CONTROLs, plus the kept ALL YEARS NOTE and box.
  - **One R1 check changed with the decision:** "variant B · FY25 + FY26 · the panel" expected FY25 to be called "PLANNED, not
    executed". It now expects no year called that beside executed money, and its description says so.
  - **Mutations:** 10 new: `v200-r1-mixed-by-kind`, `-export-mix-by-kind`, `-panel-mix-by-kind`, `-allyears-note-dropped`,
    `-allyears-box-dropped`, `-planned-beside-executed`, `-amounts-total-as-executed`, `-stored-tooltip-unsaid`,
    `-stored-note-unsaid` and `-stored-by-effective-year`. Each applies exactly once, and the new scenario catches each one.
    - `v200-r1-mixed-disclosure-b` is re-anchored on the new `flowIsMixed` line, with the same replacement. It is still caught.
    - Every other mutation still applies exactly once.
