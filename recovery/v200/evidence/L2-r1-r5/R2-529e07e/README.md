# R2: fresh evidence at commit `529e07e7e52c60aec6840152a5c8e98d37fcbdec` (11 Oct 2026, 5:08–5:11 PM ET)

**What the commit is:** R2 on top of R1 (`3aeda74`).
- **audit-board blob:** `b57d70fd…`, identical to the draft's.
- **Board:** R1's board plus R2's one changed line in `rcnSet`.
- **mutate.mjs:** 2 new entries.

The blob list is in `blobs.txt`. Environment and runner are as for R1: Node v22.22.0, jsdom 27.4.0, 600 s caps, each
command in its own process group.

| Check at 529e07e | Result |
|---|---|
| code-runtime-probe (R2), unchanged, in a git-archive copy | 6 passed, 0 failed (it was 4/2 at 9b27e80) |
| money-runtime-probe (R1) | 13 passed, 0 failed: R1 holds |
| races-probe (R3–R5) | 3 passed / 3 failed: the R3–R5 defects, not this commit's; every control passes |
| the lead's `r2-contract.mjs` | ALL OK: ß×10 and ﬃ×4 refused (AAAAA kept, field marked, "EEIC not changed"); " ab12c ", ABCDEFGHIJ and ssssssssss kept |
| the lead's `r1-variants.mjs` | ALL OK: R1 still holds |
| mutation applicability (text only) | 1,283 entries, each matching once |
| audit-board.mjs | exit 0, 161.9 s, ALL CHECKS PASSED |
| audit-recon.mjs | exit 0, 63.1 s |
| audit-other.mjs | exit 0, 41.2 s |

**Mutation catches:** the draft observed them on the same audit-board blob with R2's board change. Its logs are in
`draft/logs/`. Repeating them at this commit is pending, in the sensitivity layer.

**Not run at this commit:** audit-import, audit-hostile, audit-inject, audit.mjs, audit-ppt, boot-same and legacy-fsrc.
Those run at the end of layer 2. The adversarial verifier's review of the draft is pending.
