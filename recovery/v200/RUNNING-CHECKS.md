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

## Update at 8:16 PM ET: a third restart, and its likely cause

**What happened.** The container booted again at 00:12:29 UTC (8:12 PM ET; `/proc/stat` btime). The rerun of
`v200-r5-restore-gen` started at 7:45:15 PM ET and left no end line and no TIMED OUT line. Its 900 s cap would have fired
by 8:00:35 PM ET if its processes had kept running, so they had stopped before then. It is INCOMPLETE a second time; its
log is kept as `INCOMPLETE-container-restart-3-…`.

**Likely cause (inferred, not confirmed).** All three restarts (about 7:15, 7:44 and 8:12 PM ET) followed a stretch in which
this session was idle between turns. The drivers were detached processes (`setsid nohup`) that the session does not track.
An idle session's container is reclaimed, and the processes with it. The disk survives each time.

**What changed.** The driver was restarted at 8:15 PM ET as process group 278: run.sh 285, `timeout` 301 (process group
301), node 303. It runs the same four ids. This time the session also runs a tracked background wait, which ends when
`summary.txt` gets its DONE line or when the driver is gone. That should keep the container alive until the runs finish.
If it does not, the next restart shows it.

## Update at 10:24 PM ET: the commit-1 BASELINE did not run alone

(First committed in f32be26 headed "10:26 PM ET"; it was written at 10:23–10:24 PM ET, so the heading was corrected.)

**What runs.** The U2 commit-1 run started at 10:17:48 PM ET in the clone `rec/L2/wt-u2c1` (HEAD `4e90af4`, board
`c08c6d2c`, audit-import `e63768bf`), output `rec/L2/sens-import-u2c1/`. The lock `AUDIT_IMPORT_RUNNING` was set. Driver:
the `sens-import.sh` shell 30196, run.sh 30201, `timeout --kill-after=20 900` 30221 (process group 30221), node 30224.
Queued after it: `v200-u2-putback-gen`. `PAUSE` was set at 10:18 PM ET, so the driver waits after BASELINE.

**The overlap.** At about 10:19 PM ET the UI chunk-2 workflow started two bounded Playwright sweeps in
`/home/user/orbit-ui` (process groups 30554 and 30555, `uichunk2/sweep2.mjs` and `sweep9.mjs`, 600 s caps). My
instructions to that workflow applied the lock to suite runs only, not to Playwright. That gap is mine. Those processes
belong to the workflow, are recorded in `uichunk2/pids.txt`, and were not killed.

**How it counts.** This BASELINE is labelled OVERLAPPED and is not the alone run Brad's rule requires. It is allowed to
finish and is kept. BASELINE and `v200-u2-putback-gen` are run again, alone, once the UI workflow is idle. The driver stays
paused until then.

## Update at 10:28 PM ET: commit-1 BASELINE ended; its paused driver stopped

- **BASELINE (OVERLAPPED):** ended 10:26:43 PM ET, exit 0, 534.8 s, ALL CHECKS PASSED. Backed up as
  `evidence/L2-u2/sens-import-u2c1/overlapped/`. It does not count as the alone run.
- **The driver** (`sens-import.sh`, process group 30196, recorded above) was waiting on PAUSE with nothing running. It
  held the lock, which blocked the focused checks and the UI workflow's suites for no reason. I stopped that process group
  at 10:27:40 PM ET; its outer shell then removed the lock, as it is written to. `v200-u2-putback-gen` never started.
- **Focused U2 checks** (revised commit 2) started at 10:27 PM ET, one at a time, 600 s caps. They are not full suites.
- **The alone runs** at commit 1 (BASELINE and `v200-u2-putback-gen`) and at commit 2 wait until the UI workflow is
  idle. At 10:28 PM ET it was running its own screenshots, `tools/layout-fits.mjs` and `audit.mjs`. Each alone run
  will carry `rec/bin/overlap-watch.sh`, which records, and never kills, any node or Chromium process started outside
  the run's clone while it runs.

## Update at 10:41 PM ET: U2 commit 2 committed; the alone runs started

- **U2 (2 of 2)** is `a8891e1` (10:38 PM ET): board `1375b72b`, audit-import `ed9a3437`, mutate `9f9168fa`; 1307
  mutations, each matching once. Focused: block 2 41/41 on it; fails on base (37), commit 1 (34) and the refusal mutant (34).
- **Driver** `rec/bin/alone-u2.sh`, started 10:41 PM ET as process group 6867 (tracked background task). Order: commit 1
  (clone `wt-u2c1` at `4e90af4`) BASELINE then `v200-u2-putback-gen`; commit 2 (clone `wt-u2c2` at `a8891e1`) BASELINE,
  `v200-u2-putback-while-saving`, `v200-u2-putback-gen`.
- **How "alone" is kept.** Before each run the lock is cleared and the driver waits for 30 s in a row with no node or
  Chromium process outside the run's clone, so the UI workflow's own suites can use the gaps. Then it sets the lock and
  runs, with `overlap-watch.sh` recording (never killing) anything seen alongside. An attempt with anything seen is kept
  as `<id>-OVERLAPPED-<n>.log` and repeated, up to three attempts. Each finished attempt is backed up at once
  (`evidence/L2-u2/sens-import-u2c1-alone/`, `…/sens-import-u2c2/`).
