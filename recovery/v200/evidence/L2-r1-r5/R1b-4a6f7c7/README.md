# The R1 follow-up (Brad's three decisions): evidence at `4a6f7c73ebf9018f6b1b14087cb5ec560a9bbb20` (11 Oct 2026, 6:38–6:43 PM ET)

**Draft checks** (`draft/`): built in an isolated clone of `e635775`, with full audit-recon, audit, audit-other and
audit-board on the draft board, the money probe, and 17 mutations, each caught. An adversarial verifier reported issues.
One should-fix was fixed at integration: the planned note asked every appropriation in scope.

**Integration checks before the commit** (`integration/`): the full audit-recon with the integrated suite, run in a gap of
the audit-import driver so nothing overlapped. Board blobs are in `blobs.txt`.

| Board | Result |
|---|---|
| `2b5b02b` (before) | exit 1, 9 failing: the 8 decision checks, plus the one R1 expectation changed by decision 2 |
| changed (`4d273c06…`, committed) | exit 0, ALL CHECKS PASSED |
| `v200-r1-stored-note-any-appn` (new) | caught, 1 failing: case S, the note's scope |
| `v200-r1-stored-note-unsaid` (re-anchored) | caught, 2 failing |
| `v200-r1-mixed-disclosure-b` (re-anchored) | caught, 5 failing |

**Integrated validation at 4a6f7c7:**
- **Probes:** money 13/13, code 6/6, races 6/6.
- **The lead's cross-checks:** r1-variants, r2-contract and r4b-contract all pass.
- **Mutation applicability:** 1,305 entries, each matching once.

**Applicability of the earlier sensitivity results after this commit:**
- **audit-import (R3–R5, at af892cb): still applicable, as justified reuse.**
  - This commit's board changes are confined to the funds flow: `flowIsMixed`, the new `flowHasMoney` and `flowStoredIn`,
    and the funds-flow panel's text.
  - `audit-import.mjs` calls none of these. Its only funds-flow references are the destination-list functions (`flowEnt…`).
  - Its own file differs from `af892cb` only by one R4b case label.
  - The full audit-import is re-run at the final tree, in any case.
- **audit-recon (R1, at d4a241a): not applicable.** The R1 code and the R1 scenario changed. All v200-r1-* mutations are
  re-run at the final commit.
- **audit-board (R2, at d4a241a and 4cb1e65): repeated at the final commit.** audit-board gained the R2 follow-up block
  after d4a241a.
