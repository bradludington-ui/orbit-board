# The lead's own R4b cross-check (not one of the received probes)

`r4b-contract.mjs` checks Brad's R4b contract with a simulated file handle on a synthetic board. The hold is set by its
mark. The checks:
- Save to the board file is refused at once, before any file access: permission, read and open are all 0.
- The board says Save to the board file is refused.
- After Allow Save again, the refused Save is not resumed: still 0, and the file keeps its bytes.

**Base `9b27e80` (board the same as `1c94537`), 4:30 PM ET:** exit 0, all checks pass. So R4b holds on the unfixed board;
it needs a test, not a board change.

**Sensitivity, 4:32 PM ET:** I ran it on a disposable copy carrying the catalog mutation `impmixed-file-unguarded`. The
mutation's find and replace were read from `mutate.mjs` as text; it applies exactly once, and the mutant board's blob is
`84920f1d…` (see `mutation.diff`). Result: exit 1, 4 failing.
- "refused before any file access" got [1, 1, 1] against [0, 0, 0].
- The refusal message is missing.
- The Save is not stopped, and the file is written.

The catch is on the protection itself.

**Invalid run, kept for the record:** `INVALID-not-mutated-r4b-mut-impmixed-file-unguarded.log` (4:31 PM ET) is **not**
evidence of anything. The first mutant maker read only double-quoted entry ids. This entry's id is single-quoted, so the
maker refused with "no entry" and wrote no mutant. The run therefore checked the unmutated board, and its "ALL OK" says
nothing about the mutation. The mutant maker was rebuilt on the full JS-literal reader (`bin/mkmut.py`, `bin/mcread.py`)
and the run was repeated, as above.

**Layer-1 mutants are unaffected:** `v200-id-builtin-open`, `v200-spmt-pmo-open` and `v200-keybad-three` all have
double-quoted ids. Each was read, matched once and was diffed in the layer-1 evidence.
