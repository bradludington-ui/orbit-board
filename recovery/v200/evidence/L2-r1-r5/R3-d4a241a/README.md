# R3: fresh evidence at commit `d4a241abf29a58c68bdd7e620f764cbe33cf856e` (11 Oct 2026, 5:13–5:14 PM ET)

**What the commit is:** R3 on top of R2 (`529e07e`).
- **Board:** one line and its comment, in `_driveStorePushRun`.
- **audit-import blob:** `ca54902e…`, identical to the draft's.
- **mutate.mjs:** 3 new entries.

| Check at d4a241a | Result |
|---|---|
| races-probe, unchanged, in a git-archive copy | 4 passed / 2 failed. **R3 locked cycle now passes** (it failed at 9b27e80); the failures are R4 and R5, not yet integrated; every control passes |
| money (R1) / code (R2) probes | 13/13 and 6/6 |
| the lead's r1-variants, r2-contract and r4b-contract | ALL OK, all three |
| mutation applicability (text only) | 1,286 entries, each matching once |
| R3's committed audit-import block, alone | exit 0, 6.9 s, ALL CHECKS PASSED (8 checks) |

**How R3's block was run:** through `focused-R3-at-commit.mjs`. It is the draft's focused harness, with its block checked
byte-identical to the one committed at `d4a241a`, and with only its `boot.mjs` import path changed to this commit's copy.
The two files' contents differ only in that path. The board came from this commit's copy, with BOARD unset.

**Not yet run at this commit:** the full `audit-import.mjs`. It runs alone, at a 900 s cap plus 20 s grace, once R3–R5
are in. Also pending: mutant catches at the commit, which the draft observed with its harness on the same blobs (logs in
`draft/logs/`), and the adversarial verifier's review.
