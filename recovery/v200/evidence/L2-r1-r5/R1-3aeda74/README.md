# R1: fresh evidence at commit `3aeda741612c2cfd27306ba7ea7150992ca580d5` (11 Oct 2026, 5:04–5:07 PM ET)

**What the commit is:**
- **Board blob:** `5d811eea8ccabca5f2deaa623c8583552ed0c777`. It is byte-identical to the draft board, which was built
  in an isolated clone of `9b27e80`.
- **audit-recon blob:** `1f608e7c…`, also identical to the draft.
- **mutate.mjs:** 7 new entries, added as text. Its full blob list is in `blobs.txt`.

**Environment:** Node v22.22.0, jsdom 27.4.0, `NODE_OPTIONS=--max-old-space-size=8192`. Every command went through
`bin/run.sh`, under a 600 s cap in its own process group.

| Check at 3aeda74 | Result |
|---|---|
| money-runtime-probe (R1), unchanged, in a git-archive copy, BOARD unset | 13 passed, 0 failed (it was 10/3 at 9b27e80) |
| code-runtime-probe (R2) | 4 passed / 2 failed: the R2 defect, not this commit's |
| races-probe (R3–R5) | 3 passed / 3 failed: the R3–R5 defects, not this commit's; every control passes |
| the lead's `r1-variants.mjs` (Variants A and B, literal arithmetic) | ALL OK, 8 of 8 (5 failed at 9b27e80) |
| mutation applicability (`bin/mcount.py`, text only) | 1,281 entries, each matching exactly once; the 7 new ones match 0 times on the 9b27e80 board |
| audit-recon.mjs | exit 0, 69.8 s, ALL CHECKS PASSED |
| audit.mjs (Excel) | exit 0, 9.4 s |
| audit-other.mjs | exit 0, 36.8 s |
| audit-board.mjs | exit 0, 155.6 s |

**Mutation catches (separate from applicability).** The R1 draft agent observed each catch with the full audit-recon on
the same board blob and the same audit-recon blob. Its logs are in `draft/logs/`. They have **not** yet been repeated
against this commit; that is pending, in the sensitivity layer.

**Also recorded:** `node --check tools/export-audit/mutate.mjs` was run once at integration. It parses the file for syntax
and executes nothing; no other use of `mutate.mjs` was made.

**Not run at this commit:** audit-import, audit-hostile, audit-inject, audit-ppt, boot-same and legacy-fsrc. Those run at
the end of layer 2. verify:grid and the standards check wait until R1–R5 are integrated.

`draft/` holds the draft's own deliverables, its logs, and the exact diff that was applied (`integrated.diff`). The
adversarial verifier's review of the draft is still pending.
