# R4 and the R4b test: fresh evidence at `a0a9a6f7a1803b4371dd698c67d05e138cb70e7f` (11 Oct 2026, 5:33–5:35 PM ET)

**Integrated validation at a0a9a6f:**
- **Probes**, run unchanged in a git-archive copy: money 13/13, code 6/6, and races **5/6**. The R4 case now passes; the
  only failure left is R5, which is not yet integrated. Every control passes.
- **The lead's cross-checks:** r1-variants, r2-contract and r4b-contract all pass.
- **Mutation applicability:** 1,290 entries, each matching once.
- **The committed R4 and R4b blocks:** checked byte-identical to the commit's `audit-import.mjs`, then run alone through
  `focused-R4-at-commit.mjs` (the draft's harness with only its boot import changed). Exit 0, 10.3 s, ALL CHECKS PASSED.

**Draft checks** (`draft/`, on the same blobs):
- **R4:** fails on 9b27e80 on the protection (opened and written, with no refusal); it passes with the fix.
- **R4b:** passes on 9b27e80, because it guards a check that already existed.
- **Catches** with the draft's harness: v200-r4-no-recheck, -held-quietly and -said-not-held were caught by the R4 block,
  and impmixed-file-unguarded by R4b's before-file-access check.

**Committed-suite sensitivity:** pending. It needs the full audit-import.mjs, run alone at a 900 s cap plus 20 s grace,
for each mutation.

**The full audit-import.mjs:** not yet run at this commit. It runs once R5 is in.

**Tracked, not changed (proposed to Brad separately):**
- A Save queued behind a running save while the hold is on runs if saving is allowed again before its turn.
- The folder save's window for the hold has not been tested.
