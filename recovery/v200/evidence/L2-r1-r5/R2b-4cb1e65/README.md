# R2 follow-up: fresh evidence at `4cb1e653261c921e58e0a0f810214a81905f1b46` (11 Oct 2026, 5:20–5:32 PM ET)

Brad's decision: "For R2, explain that the length limit applies after trimming and uppercasing."

**Fail-before and pass-after of the new test** (`fail-before/`). Both runs used the full `audit-board.mjs` with the new
block, BOARD set to each board, 600 s caps, run in parallel:
- **Before:** the R2 commit's board (`fd728f1c…`, as at `e635775`). Exit 1, 3 failing: the three new EEIC message checks.
  The RCN CONTROL passes.
- **After:** the changed board (`69068a93…`). Exit 0, ALL CHECKS PASSED.

**Integrated validation at 4cb1e65:**
- **Probes:** money 13/13 and code 6/6. Races 4/6: the failures are R4 and R5, which are not integrated yet.
- **The lead's cross-checks:** r1-variants, r2-contract and r4b-contract all pass.
- **Mutation applicability:** 1,287 entries, each matching once.
- **audit-board:** exit 0, 163.4 s.

**Committed-suite sensitivity at 4cb1e65** (`sens/`):
- **Mutation:** `v200-r2-why-unexplained`, read as text; it applies once.
- **Result:** audit-board exit 1, with 3 failing checks, all in the new block.
