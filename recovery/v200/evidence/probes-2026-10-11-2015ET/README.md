# Probes run 11 Oct 2026, 8:15–8:55 PM ET: U13, the U1 demonstration and U2. Draft checks, adversarially verified

These probes ran on disposable copies; nothing in the product changed. The board trees and the copied `tools/` folders are
not kept here. Their blobs and one-line diffs are recorded in each probe's README, VERDICT and `diffs/`.

| Folder | What it shows | Builder | Verifier |
|---|---|---|---|
| `u13probe/` | Reproduces U13 on board `4d273c06` | 5 runs: S1pull and S1tick each fail 5 contract checks; controls C1, C2 and C3 pass | `verify/VERDICT.md`: sound, with issues. Re-ran it identically; tried to refute it with V1–V5; mutants confirm the controls are sensitive |
| `u1demo/` | Brad's demonstration on boards `4d273c06` (before) and `b4c55e38` (U1) | AFTER: 424 pass, 0 fail. BEFORE: 276 contract failures, 0 control failures | `verify/VERDICT.md` |
| `u2variants/` | The counter repair and the busy-save refusal, built and run separately | U2a counter: the work stays unsaved after the older write, and reopening keeps it. U2b refusal: 24 of 24 pass | `verify/VERDICT.md` |
