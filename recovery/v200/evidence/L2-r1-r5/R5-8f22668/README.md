# R5: fresh evidence at `8f2266839c8c814f357dc565aa196a5cf64aaabb` (11 Oct 2026, 5:36–5:37 PM ET)

This commit completes R1–R5.

**Integrated validation at 8f22668:**
- **Probes**, run unchanged in a git-archive copy: **money 13/13, code 6/6, races 6/6**. At 9b27e80 they were 10/13, 4/6
  and 3/6.
- **The lead's cross-checks:** r1-variants, r2-contract and r4b-contract all pass.
- **Mutation applicability:** 1,292 entries, each matching once. That includes the re-anchored `unsaved-flag-never-set`,
  and `impmixed-file-unguarded` and `guard-fails-open`.
- **The committed R5 block:** checked byte-identical to the commit's suite, then run alone through
  `focused-R5-at-commit.mjs` (the draft's harness with only its boot import changed). Exit 0, 7.1 s, all 7 checks pass.
- **The full audit-import.mjs**, alone at 900 s plus 20 s grace: started at 5:37 PM ET. Its result is recorded separately
  once it finishes.

**Integration note:** the R3, R4/R4b and R5 audit-import blocks were inserted at the same point, which caused a three-way
conflict. It was resolved by keeping all of them, in the order R3, R4, R4b, R5, before the scenario-ran guard. Each block
is byte-identical to its draft's `block.mjs.txt`, and `node --check` parses the file.

**Draft checks** (`draft/`):
- **Fail-before at 9b27e80:** 4 of 7 checks fail, all on the protection; the controls pass.
- **Catches** with the draft's harness: v200-r5-restore-gen and v200-r5-restore-basedirty. The re-anchored
  unsaved-flag-never-set is caught by existing blocks.
- **Committed-suite sensitivity:** pending. It needs a full audit-import for each mutation.

**Tracked, not changed (proposed separately):** `keptPutBack` has the same gap as R5.
