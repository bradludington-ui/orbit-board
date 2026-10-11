# Bounded checks running or held, with their exact identities (recorded 11 Oct 2026, 7:17 PM ET)

The container restarted at about 7:15 PM ET (uptime 0 min at 23:15 UTC). That killed the earlier drivers; their
interrupted run is recorded as INCOMPLETE. All values below were read from the live processes and files.

## 1. RUNNING: committed-suite sensitivity in audit-import (preserved, not touched)

- **Driver:** `bin/sens-import.sh`, sha256 `5c4ab31c…`, PID **299** (process group 299), started 23:16:11 UTC.
  - It uses the runner `bin/run.sh` (sha256 `1118d438…`): a 900 s cap with a 20 s grace, its own process group, and the
    PID recorded.
  - It builds each mutant with `bin/mkmut.py` (sha256 `0a5188f1…`) and `bin/mcread.py` (sha256 `8534a8d9…`). These read
    `mutate.mjs` as text only.
- **Tree:** a git clone at `af892cb12713dd22afd9a84c0ec604b30614f6ea`. It is a real git repository, which audit-import's
  v1.86 block needs.

  | File | Blob |
  |---|---|
  | board | `82c7f446b292af5a4c6f847170417eb9072df001` |
  | audit-import.mjs | `28c04e49fea3e383b02738081ed4a6ab004c4521` |
  | mutate.mjs | `6c084989caae7339d0445701dc54ca9161603488` |
  | boot.mjs | `9c4f49ad8cec537097bdf485458cfd2a09b06594` |

- **Run in progress:** `v200-r4-no-recheck` (the mutant board is blob `f6f1ac343368380239d24e062bda094a6230d289`).
  - Process chain: run.sh PID 317, then `timeout --kill-after=20 900` PID 333, then `node tools/export-audit/audit-import.mjs`
    PID 336, with BOARD set to the mutant.
  - Started 23:16:13 UTC. It repeats the run the restart interrupted.
- **Queued after it, in order:** `v200-r4-held-quietly`, `v200-r4-said-not-held`, `v200-r5-restore-gen`,
  `v200-r5-restore-basedirty`, `unsaved-flag-never-set`, `impmixed-file-unguarded`.
- **Completed before the restart:**
  - the BASELINE, which passed;
  - `v200-r3-cycblock-gone`, `-falls-through`, `-says-saved`, `-landed-view-unsaid` and `-landed-view-prefix`, each
    caught by its own R3 checks (see `summary.txt`).
- **Interrupted:** the first `v200-r4-no-recheck` (started 23:00:26 UTC) is **INCOMPLETE**. Its log was kept as
  `INCOMPLETE-container-restart-v200-r4-no-recheck.log`.
- **Results location:** `scratchpad/rec/L2/sens-import-af892cb/` (`summary.txt`, one log per run, the mutant diffs and
  JSON).

## 2. HELD: the final-tree queue (stopped before it started anything)

- **Driver:** `bin/final-tree.sh`, sha256 `015c9e67…`, PID 308. It was waiting for the sensitivity sequence's DONE line,
  and was stopped at 7:17 PM ET by its recorded PID, before running any check.
- **Why it is held:** Brad, 7:17 PM ET: "Before starting the expensive final-tree queue, identify any imminent product
  changes and their required retests."
- **Its target:** a git clone at `d1ee751660348cd04b121808b7a17dd90bbf3658`, whose board, tools and package.json are
  identical to `4a6f7c73ebf9018f6b1b14087cb5ec560a9bbb20`.
- **What it would run:**
  1. the full audit-import alone (900 s + 20 s);
  2. the other nine suites (600 s each);
  3. every `v200-r1-*` mutation in audit-recon and every `v200-r2-*` mutation in audit-board;
  4. verify:grid and standards;
  5. applicability.
- **When it restarts:** once the product tree is final, against that tree.

## Update at 7:38 PM ET

**Final-tree driver.** PID 308 was still listed one second after its stop signal, and was gone at the next check, 7:18 PM
ET. It had started nothing: `final-d1ee751/` holds only `driver.out`.

**Sensitivity sequence.** Still running in the same driver (PID 299, af892cb clone). Since the restart:
- `v200-r4-no-recheck` was repeated and **caught**: exit 1, 534.1 s, 3 failing, in the R4 block.
- `v200-r4-held-quietly` was **caught**: exit 1, 491.5 s, 1 failing, in the R4 block.
- **Now running:** `v200-r4-said-not-held`. Its process chain is sens-import subshell 1758, run.sh 1759, then
  `timeout --kill-after=20 900` 1774 (process group 1774), then node 1777. It started 23:33:19 UTC.
- **Still queued:** `v200-r5-restore-gen`, `v200-r5-restore-basedirty`, `unsaved-flag-never-set`, `impmixed-file-unguarded`.

**Alongside it.** Only bounded U1 probes ran, one at a time, from 7:22 to 7:29 PM ET; each took under 12 s. No full suite ran.
