
## What was NOT done
- **Nothing in `/home/user/orbit-board` or `/home/user/orbit-ui` was edited, staged, committed or pushed.**
  - orbit-board was read only, with `git --no-optional-locks` (status, log, rev-parse) and `git hash-object`. It stayed clean.
    Its HEAD moved from `a386223` to `9ef4f28` during the check: records-only commits by other sessions, 15:37 to 15:39 ET. The
    board blob stayed `98eed7e8`.
  - orbit-ui was only `git status`-ed. It shows ` M ui-concept/CHUNK3.md`, which is not mine.
- **Not run:**
  - `mutate.mjs` was never read, imported or run.
  - The full `audit-import.mjs` and `audit-board.mjs` were not run, and no suite was run.
  - No Chromium or Playwright, and no `playwright install`.
- **Nothing in the builder's directory `rec/L4/u24` was changed.** Its probe and checker were copied to `probe-copy/` and run from
  there. Its outputs were only read.
- **No fix was applied and no product diff was written.** `PROPOSAL.md` amends the builder's proposal tests only.
- **Not tried:**
  - the `file://` XHR sidecar route (jsdom refuses localStorage for `file://`, measured in `logs/fileorigin.log`);
  - a second tab or Web Locks (U20);
  - the next 💾 Save or ↶ Put back from the falsely-clean states (U17);
  - `bootTakeFile`'s "no room" offer;
  - the autosave route for BT and IB (only SHc-fold-Wauto was run).
- **Not re-run separately:** the builder's dev, dev2 and r1 passes. x1 re-runs all 38 scenarios of the final probe; r1's agreement
  with r2 was checked from the builder's own outputs.
- **Real-world frequency** of a slow write, a slow state-file answer, or a click during a save was not measured. The holds stand
  in for the slowness.

## Deviations (full list in `logs/deviations.txt`)
- A few small read-only shell utilities ran directly, not through q.sh:
  - `ls`, `mkdir -p` of my own directory, `tail`, `cat`/`grep`/`ls` of my own logs;
  - the x0 smoke loop itself, whose node run was bounded.
- None was node, Python or Chromium.
