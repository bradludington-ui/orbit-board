# Committed-suite sensitivity for R1 and R2, at commit `d4a241abf29a58c68bdd7e620f764cbe33cf856e` (11 Oct 2026, 5:14–5:28 PM ET)

**How it was run:**
- Each mutation was read from `d4a241a`'s own `mutate.mjs` as text, with `bin/mkmut.py`. It was applied to a disposable
  copy of `d4a241a`'s board only when it matched exactly once.
- The committed suite was then run against the mutant: BOARD set to the mutant, every failure reported, a 600 s cap, one
  run at a time (`bin/sens.sh`).
- **Applicability (the match count) and the catch (the suite failing) are recorded separately**, in `summary.txt`.

Every mutation applied exactly once, and every one was **caught**. Every failing check is in that finding's own scenario:

| Mutation | Suite | Failing checks | Scenario of every failure |
|---|---|---|---|
| v200-r1-raw-year-exec | audit-recon | 14 | v2.00 (R1) |
| v200-r1-saved-year-widens | audit-recon | 8 | v2.00 (R1) |
| v200-r1-mixed-disclosure-b | audit-recon | 2 | v2.00 (R1) |
| v200-r1-export-note | audit-recon | 1 | v2.00 (R1) |
| v200-r1-help-claim | audit-recon | 1 | v2.00 (R1) |
| v200-r1-scan-stops-early | audit-recon | 4 | v2.00 (R1) |
| v200-r1-mix-words-one-kind | audit-recon | 2 | v2.00 (R1) |
| v200-r2-eeic-checked-raw | audit-board | 2 | v2.00 (R2) |
| v200-r2-eeic-not-upper | audit-board | 2 | v2.00 (R2) |

The R3 mutations are pending. Their committed suite is audit-import, which runs alone, at a 900 s cap.
