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

## Update at 11:47 PM ET: commit-1 results; the first driver stopped; the remaining runs restarted

- **Commit 1 BASELINE, alone:** 10:41:35 PM ET, exit 0, 483.1 s, **ALL CHECKS PASSED**, nothing seen alongside
  (`ad0dd2f`). This is the alone BASELINE for `4e90af4`; the 10:17 PM run stays OVERLAPPED.
- **Commit 1 `v200-u2-putback-gen`:** three attempts, each **caught** (exit 1, 9 failing checks, all 7 failing scenarios
  in "v2.00 (U2) — work put back during a save stays unsaved"; 498.5, 504.4 and 486.6 s). All three overlapped the UI
  chunk-2 reviewer's Playwright probes (`uichunk2/rv2`), so none counts; each is kept as `…-OVERLAPPED-<n>.log`
  (`b41e99e`, `1cc9313`, `dc082dd`). The driver then stopped, as written (exit 4, 11:42 PM ET), and cleared the lock.
- **UI workflow** `wf_2a4e903a-382` completed by 11:36 PM ET; nothing of it runs now.
- **Restart:** `rec/bin/alone-u2b.sh` (a copy of the first driver with only the id list and attempt numbering changed),
  started 11:47 PM ET as process group 29586: commit 1 `v200-u2-putback-gen` (attempts from 4), then commit 2 BASELINE,
  `v200-u2-putback-while-saving`, `v200-u2-putback-gen`.

## Update at 12:27 AM ET: U2's full runs, all alone, are complete

Driver `alone-u2b.sh` (process group 29586) ended 12:26:45 AM ET, exit 0, lock cleared. The watcher
saw nothing alongside any of these runs (no OVERLAP line between each run's start and end lines).

| commit | run | started (ET) | exit | s | result | backup |
|---|---|---|---|---|---|---|
| `4e90af4` (1) | BASELINE | 10:41:35 PM | 0 | 483.1 | ALL CHECKS PASSED | `ad0dd2f` |
| `4e90af4` (1) | `v200-u2-putback-gen` attempt 4 | 11:48:03 PM | 1 | 554.0 | **caught**: 9 failing, 7 scenarios, all in the U2 counter block | `5258617` |
| `a8891e1` (2) | BASELINE | 11:57:55 PM | 0 | 550.7 | ALL CHECKS PASSED | `3329d0e` |
| `a8891e1` (2) | `v200-u2-putback-while-saving` | 12:07:44 AM | 1 | 548.2 | **caught**: 34 failing, all 8 scenarios of the refusal block | `09fe6c9` |
| `a8891e1` (2) | `v200-u2-putback-gen` | 12:17:30 AM | 1 | 549.0 | **caught**: 1 failing, (d) "K put back with no save running" (the count read from `_saveGen`: got [0,0], want [0,1]) | `4216d13` |

At commit 2 the counter is caught by (d) alone, as block 1 was written to be: with the refusal in place a put-back during a
save is refused, so block 1's race scenarios accept either outcome, and (d) keeps the count itself tested. Overlapped
attempts (10:17 PM BASELINE; `v200-u2-putback-gen` attempts 1–3) are kept and do not count.

## Update at 6:09 AM ET, 12 Oct: a restart while idle; Brad's decisions; the next work started

(First committed in `2f16302` with this heading at 6:16 AM ET and the start at 6:14 AM ET; both were written at 6:09 AM
ET, later than the clock. Corrected from the session's own timestamps: the U1 diff was shown at 6:05:37 AM ET and the
workflow was launched at 6:08:07 AM ET.)

- **Restart.** The container booted again at 6:00:21 AM ET (`/proc/stat` btime), after the session sat idle from about
  12:30 AM ET. Nothing was running: every U2 run had finished and was backed up. The disk survived (scratch, both clones,
  `/home/user/orbit-ui`).
- **Brad, 6:00 AM ET:** U2 accepted as complete; its separate reopening/adoption findings stay open (ledger U15–U20).
  Selected next: U13's refusal (own commit); U1 (diff shown first) then U14 to his scope (separate commits); UI M1 in
  chunk 3 with cancellation and failed-rollback tests; layout tests updated for the slide-over default, keeping docked
  checks. S1–S5 shown, not applied. Then integrate and pin, run the final-tree queue once, and report its evidence matrix
  and the unresolved ledger. The presweep and the full gate stay paused until Brad has reviewed that matrix.
- **Work started 6:08 AM ET** as workflow `wf_1c65fbc2-2c5`: three tracks (U13; U1+U14; UI chunk 3), each with a builder,
  an adversarial verifier and up to two fix rounds. Safety tracks write drafts only, in `rec/L3/` (base: a read-only
  archive of `0c6ff00`); the UI track commits only on the local `claude/v200-ui`. No full audit-import runs meanwhile.

## Update at 6:13 AM ET: Brad's 6:11 AM approvals; the work relaunched as two workflows

- **Brad, 6:11 AM ET:** U1 as its own commit, then U14 separately, preserving the independent arithmetic and
  saved-selection controls. Approved within his stated scopes: S1, S2, S3, S5, and S4 (tools updated for relocated
  controls and the slide-over default with docked coverage kept; the Import dialog's opener/return-focus fixed; the 1152
  wrap shown usable, not waived). M1 and U13 continue as separate fixes with focused tests and independent reviews. The
  final-tree queue, presweep and full gate stay held until the selected changes are integrated and pinned; then the
  queue runs once.
- **Relaunch.** Workflow `wf_1c65fbc2-2c5` (launched 6:08 AM ET) was stopped at 6:11 AM ET before its UI builder had
  started, so the approvals could be folded in; its two safety builders had run about 3 minutes (the partial U1/U14
  directory is kept as `rec/L3/u14-aborted-0611`; nothing else was written). Relaunched as `wf_ed273e24-21b` (safety:
  U13; U1 then U14) and `wf_d5c82278-87a` (UI: M1, then S1–S5, each part reviewed). Nothing else is running.

## Update at 6:18 AM ET: UI bundle backups; the final-tree queue pinned to the integration SHA

- **UI branch backup** (`rec/bin/ui-bundle.sh`): `claude/v200-ui` is bundled from `4a6f7c7` into
  `recovery/v200/ui-backup/` on this branch, then RESTORED to prove it: a fresh clone of `claude/v200-fixes-wip` from
  GitHub, `git bundle verify`, fetch of the branch from the bundle, and the restored tip, tree and full commit list
  compared with the local branch. First backup `90cbacf` at 6:17 AM ET: tip `eba613f`, tree `27a0e1b8`, 9 commits,
  identical. It runs again at every checkpoint and whenever the UI branch moves; a superseded bundle leaves the tree
  but stays in history; every manifest stays.
- **The final-tree queue** (`rec/bin/final-tree-v2.sh`) now takes the pinned integration SHA and refuses to start
  unless its clone is exactly at that SHA with no tracked change. It runs every suite in `audit:suites`, the new
  `audit-ui`, the sensitivity of every v2.00 mutation at that tree (audit-import's alone; audit-recon, audit-board and
  audit-ui for theirs, which includes M1's cancellation and rollback mutations), `verify:grid` and `standards`,
  applicability, and an informational lane (check, math-defects, money-coverage, trace-matrix, money-map,
  roundtrip-fuzz). `validate-math` is not run: it executes mutate.mjs.

## Update at 6:53 AM ET: the 135 pre-reset v2.00 mutations join the queue; a timing sample

- **Inventory (text only):** mutate.mjs holds 1307 entries; 168 are `v200-*`: R1 18, R2 3, R3 5, R4 3, R5 2, U2 2, and
  **135 pre-reset v2.00 hardening mutations** (escapes, key lookups, doors). All 135 apply once at `a8891e1`. Their
  earlier results were lost with the reset, so they are not reinstated: the final-tree queue now runs them.
- **How:** `rec/bin/sens-chain.sh`, a first-catch chain that asks what the repo's sweep asks ("does any check fail?")
  without running mutate.mjs: each mutant is made as text, then audit-inject, audit-hostile, audit-other, audit,
  audit-ppt, audit-recon and audit-board run one at a time with `MUT_FIRST_FAIL=1` until one fails. A mutation none of
  them catches gets audit-import ALONE (`alone-run.sh`, `FIRSTFAIL=1`). The reimplementation set (R1–R5, U2, U13, U1,
  U14, UI chunk 3) keeps full runs that record every failing check.
- **Timing sample** (6 of the 135, on the read-only base copy, 6:47–6:52 AM ET, 313 s; sample only, not evidence):
  5 caught by audit-inject in 6–16 s each; `v200-door-dest-open` passed all seven cheaper suites (about 260 s) and needs
  audit-import (`rec/L3/chain-sample/`).

## Update at 7:01 AM ET: Brad's 6:59 AM instructions; the exact manifest; a count corrected

- **Brad, 6:59 AM ET:** finish the approved builders and reviews; the 135 pre-reset mutations and the full gate stay
  held; re-measure U17 after U13, reproduce U19 on the committed head, run a bounded U20 lock-wait probe with controls,
  and propose corrections separately; the pinned baseline and the new/affected-protection evidence matrix come first;
  earlier catches are reused only with established source identity and applicable scope; mutation testing stops for a
  suite whose unmutated baseline fails.
- **A count I gave was wrong.** At 6:53 AM ET I told Brad audit-import had "16 known mutations" and "about 19 runs".
  The groups I listed total 14: R3 5, R4 3, R5 2, U2 2, R4b's `impmixed-file-unguarded` and `unsaved-flag-never-set`
  (an older mutation R5 re-anchored). With U13's three (the builder made three, not two) it is 17 mutants plus the
  baseline: 18 alone runs.
- **The exact manifest** (`rec/bin/mkmanifest.py`, mutate.mjs read as text) at `a8891e1`:
  `manifests/mutation-manifest-a8891e1.tsv`: 170 ids, every one applying once; 35 reimplementation (audit-import 14,
  audit-recon 18, audit-board 3) and 135 pre-reset, held. The queue's manifest is regenerated from the pinned clone and
  must match it.
- **The queue** is now `rec/bin/final-tree-v3.sh` (v2 kept as `final-tree-v2.superseded-0701.sh`): baseline first,
  then sensitivity for "new", "affected", "reimpl"; gated on each suite's baseline; the 135 and the informational lane held.
- **U13 builder finished at 6:51 AM ET** (`rec/L3/u13`); its review is running. Its new findings are U21–U24 in the ledger.
- **The UI builder amended its own M1 commit**: `eb4dbfb` (bundled at `216773a`) became `aac8574` (6 lines in the board
  and audit-ui); bundled and restore-verified at `8236737`.

## Update at 7:06 AM ET: Brad's 7:04 AM points

- **U13's late guard** is the essential protection. Its general review is running; a second, independent reviewer
  (started about 7:05 AM ET, `rec/L3/verify-U13-lateguard`) checks only that no step before the guard (every early
  return, every function it calls, every entry route) changes a folder copy, storage, a base record or a dirty flag
  during a save, with instrumented writes and byte-for-byte snapshots, controls on the before board, and an entry-only
  mutant. U13 is committed only after both.
- **U24** stays unverified, severity provisional. Its bounded reproductions with healthy controls join the post-commit
  triage with U17, U19 and U20; any fix is proposed separately.
- **M1's evidence** is at `aac8574`: every reported audit-ui and mutation run started after the amend (6:52:44 AM ET).
  No `eb4dbfb` result is reused. The review runs on `c41a7c2`, whose board and tools equal `aac8574`'s (its diff touches
  only `ui-concept/`). The final tree reruns them on the integrated code.
- U21–U23 stay separate open findings. The next decision waits for the committed U13 review, the U17/U19/U20
  reproductions and the final-tree evidence matrix. Presweep, full gate and the 135-mutation lane held.

## Update at 7:14 AM ET: Brad's 7:12 AM approvals: UI-C1, and npm run check first

- **UI-C1** approved as a separate UI commit. Built in its own worktree (`scratchpad/ui-c1-wt`, local branch
  `claude/v200-ui-c1` from `c41a7c2`, started at 7:14 AM ET; first written here as 7:16, later than the clock, and corrected) so it never edits the checkout the UI workflow uses.
  Once the UI workflow ends, the commit is cherry-picked onto `claude/v200-ui`; the independent review and the
  before-fail/after-pass evidence are then taken on that exact committed diff.
- **npm run check is now step 0 of `final-tree-v3.sh`**, mandatory: if it does not pass at the pinned tree, the queue
  stops before any suite or sensitivity run, and its failures are resolved first. Today: `a8891e1` passes (7:13 AM ET,
  2.6 s), and so does the U13 draft board `a88a1e5b` (2.4 s). Every safety commit is checked before it is made.

## Update at 7:17 AM ET: UI-C1's acceptance clarified (Brad, 7:16 AM ET)

- **My error, 7:14 AM ET:** I told Brad the saved file would "stay byte-identical to the base board". UI-C1 changes the
  program embedded in every saved board, so the whole saved HTML cannot be byte-identical; only its data payload can.
- **Acceptance now:** the data payload byte-identical and preference behaviour equivalent; the program part of a saved
  file differing only by the ten approved `jsa()` routings; every differing timestamp or metadata value listed with
  before/after values; a reopened saved file whose corrected controls work. Sent to the UI-C1 builder at 7:17 AM ET.
- **After the cherry-pick** onto `claude/v200-ui`, all of it is repeated on the exact resulting commit, including any
  conflict resolution, and the independent review reads that commit's diff. The holds stay until the reviews and the
  pinned-tree matrix are complete.

## Update at 7:57 AM ET: U13's two reviews

- **General review #1** (workflow `wf_ed273e24-21b`): sound, with issues. Must-fix: the Connect refusal said "Nothing was
  loaded from the shared folder" while the same Connect still pulls the execution/ACE/RP stores. Should-fix: status-line
  checks for (3c) and after landing; four "(a CONTROL)" checks in (4a)–(4d) are preconditions. A fix round is running.
- **Late-guard review** (Brad's 7:04 AM point; `evidence/L3-u13/lateguard-review/`): **holds, with listed non-copy side
  effects.** 346 cells with a save under way (5 calls, 13 branches, 4 timings) changed no copy, storage, base record or
  dirty flag before the guard, on `a88a1e5b`; 242/242 on the builder's revised `98eed7e8` (message only). Controls:
  no save under way, after equals before in every cell; the guard moved to the top lets U13's adoption through in 9
  cells (a save starting during the refresh's own wait). Side effects outside the pull, listed: the lock heartbeat, a
  queued autosave, the Connect's permission flags, the picker. New boundary finding opened as U25; the U13 reviewer's
  pre-existing status-line findings as U26.

## Update at 8:54 AM ET: U13 committed

- **U13 = `63bd8b0`** (8:53 AM ET), on top of `b9221fd`; pushed. Board `98eed7e8` (from `1375b72b`), audit-import
  `4aba2506` (+339, one block after the U2 put-back-waits end marker), mutate `3ddaa30d` (+16, five entries before the R3
  anchor). Before committing: base blobs verified, the three files copied and their blobs verified, `npm run check`'s tool
  passed (2.5 s), 1312 mutations each matching once (text), and the focused block re-run by the lead on the committed
  content: 42 of 71 fail on `1375b72b` (exit 1, 23.2 s), all pass on `98eed7e8` (exit 0, 23.2 s), ending 8:52:54 and
  8:53:17 AM ET.
- **Reviews:** general review #1 sound-with-issues (Connect wording; fixed), #2 no must-fix; the late-guard review holds.
  Process lapses both builder and reviewers disclosed (a few unbounded python/shell one-liners on their own files; every
  node run bounded with the lock checked) are recorded here as reported.
- **Evidence:** `evidence/L3-u13/` (build, both reviews, the commit check). U27 opened from the fix round.
- Still to come for U13: the full audit-import alone and its full-suite sensitivity, in the final-tree queue; U17
  re-measured on `63bd8b0` in the post-commit triage.
- **Correction:** commit `b954eed` says "U27 opened", but its ledger edit failed (a script matched two "U17" rows) and the
  ledger was not changed in it. The U13 status, the U17 note and U27 are added in the next commit.

## Update at 8:55 AM ET: the post-commit triage started

Workflow `wf_d92fc4e6-08d` on a read-only archive of `63bd8b0` (`rec/L4/base`): U17 re-measured on the U13 commit (every
route that reached it before, controls on `1375b72b`, and a search for any remaining route, e.g. U25's boundary); U19
reproduced on the committed head (board-file save, then Put back and Save's HOLD ON; controls); a bounded U20 lock-wait
probe (a shared, FIFO, exclusive in-process Web Lock mock for two tabs; controls); U24's three paths each tried during a
held folder save and a held file save, with controls, or shown unreachable by code. Each probe is read-only, has its own
adversarial checker, and puts any correction in a separate PROPOSAL.md, never applied.

## Update at 9:06 AM ET: the queue's provenance gap closed

- **Gap:** the final-tree queue and several helpers existed only in scratch (`rec/bin`), so their source had no backed-up
  identity. Fixed: `2be68a1` copies every run script to `recovery/v200/bin/` with `BLOBS.md`; `7149736` makes the queue
  refuse to start unless each script it runs equals that backed-up copy, and record their blobs in `suites/scripts.txt`.
- **The queue now:** `recovery/v200/bin/final-tree-v3.sh`, blob `a879738c` (at `7149736`); helpers as in `BLOBS.md`.
- **Scripts used by earlier runs:** `sens-import.sh` was backed up on 11 Oct (blob `1396e6f5`) and used unchanged by the U2
  alone runs; the only later change is the `FIRSTFAIL` option (default off; 6:53 AM ET today), now `4874e058`. The U2
  drivers and helpers were last modified before those runs began (last-modified: alone-u2.sh 10:40 PM ET; alone-u2b.sh 11:37 PM ET; overlap-watch.sh 10:39 PM ET; backup-run.sh 10:39 PM ET; ) and are backed up unchanged.

## Update at 10:09 AM ET: the runner correction (Brad's request after the 9:25 AM ET checkpoint)

- **Restart and usage limit.** The session hit its usage limit (agents failing from about 9:12 AM ET: U1/U14 review #2, M1
  review #2, all four triage probes); the container then restarted at 10:01:34 AM ET. Nothing committed was lost. The three
  workflows were resumed at about 10:03 AM ET from their run ids (finished agents cached; only the failed ones re-run; the
  UI script now refuses to start S1–S5 unless M1's review completes with no must-fix). U17's and U19's partial probe
  directories are kept as `rec/L4/*-aborted-at-usage-limit`.
- **Runner correction = `40f7979aa2db1464218b9ec5785f8a1511c15916`** (records only; no product file). final-tree-v4.sh runs
  only from a task-local snapshot of recovery/v200/bin at a full backup SHA on origin/claude/v200-fixes-wip, checked file for
  file and blob for blob and immutable (chattr +i; the read-only bit alone does not stop root) before anything runs; every
  helper, mkmanifest included, is re-checked against that commit immediately before it runs; alone-run, sens-import and sens
  take their helpers from their own snapshot directory; run.sh writes PIDs outside the snapshot (RUNNER_PIDS); a baseline
  authorizes sensitivity only through gate.sh (exit 0, the suite's own completion verdict, an end line, no timeout, no
  failing-check line). Found and fixed while writing the self-test: v3's clone check passed a MISSING clone (two empty
  rev-parse results compared equal).
- **Self-test** (runner-selftest.sh, from a frozen snapshot of `40f7979`, 10:08 AM ET, exit 0): **13/13**. A1 queue with
  mkmanifest.py altered refused, outdir not created; A2 alone-run with sens-import.sh altered refused before the lock; A3
  sens.sh with mkmut.py altered refused, no mutant; A4 a helper outside the snapshot refused; A5 a short SHA refused; A6
  CONTROL unaltered snapshot verified, stopped only at the missing clone; A7 an unfrozen snapshot refused; G1 banner + exit 1,
  G2 banner + timeout (exit 124), G3 banner + interrupted runner (no end line), G4 failing-check line + exit 0, G5 exit 0
  without the verdict: all REFUSED; G6 CONTROL banner + exit 0 ACCEPTED. Evidence: `evidence/runner-40f7979/selftest/`.

## Update at 10:52 AM ET: runner correction 2 (the independent review of 40f7979 did not approve it)

- **Correction (10:54 AM ET; this note itself first said "10:55 AM ET", again later than the clock -- its commit `0c189f0` was
  made at 10:54:33 AM ET -- and is corrected here at 10:56 AM ET):** this heading first said "10:54 AM ET", a time later than the clock: commit `80b2d0b` was
  made at 10:52:54 AM ET. Corrected here.

- **Review of `40f7979`** (10:09–10:29 AM ET; `evidence/runner-40f7979/review/VERDICT.md`): **not approved**. Req 1 and 4
  met; Req 2 and 3 not met, narrowly. Two must-fixes: **M1** `python3 -c` without `-I` in sens-import.sh (imports `re` and
  `collections` from the launch directory; reproduced with planted modules) and in run.sh; **M2** run.sh's `setsid` without
  `-w` records exit 0 at once when job control is on (reproduced: banner then exit 1 was ACCEPTED four seconds later).
  Should-fixes S1–S9 (environment trust: git filters via `GIT_CONFIG_*`, replace refs via `GIT_DIR`, `BASH_ENV`, exported
  functions; a failed fetch passed silently; in-band trailer markers, a banner after the trailer, `NOT ALL CHECKS PASSED`;
  a `..x` file and an unfrozen snapshot root; refusals inside `$( )` and lanes that did not stop the queue; `.` as the
  verdict for verify:grid and standards; NUL and "TIMED OUT" false refusals; self-test gaps; a truncated BOOTSTRAP.txt).
  The reviewer found none of them triggered in the environment the queue runs in; its re-run of the self-test was 13/13.
- **Runner correction 2** (this commit; records only, recovery/v200/bin): both must-fixes and every should-fix.
  - One preamble, byte-identical in all nine runner shell scripts: `#!/bin/bash -p` and a re-exec under `env -i` (same
    PID) keeping only the runner's own variables and the proxy; a fixed PATH/HOME/LANG/NODE_OPTIONS/NODE_PATH/Playwright/CA
    environment (the values these runs already used, now set rather than inherited); provenance git with no system or
    global config and no replace refs; blob ids computed directly in `python3 -I`.
  - The runner commit must be on origin's claude/v200-fixes-wip at launch (`ls-remote`); a failed read refuses.
  - The snapshot is `<outdir>/runner`, frozen whole (root included), checked entry for entry with `find`, links refused;
    `vh` re-checks the frozen directories and the file at every call; the outdir must be new.
  - run.sh: `setsid -w`; `python3 -I`; writes `<log>.exit` (exit, duration, the finished log's size and blob) after the
    trailer; never overwrites a log. gate.sh: requires that record, an unchanged log, run.sh's header and trailer, the
    pinned commit in the header, and the verdict as the suite's LAST line (whole-line match; standards on its real two-line
    verdict; verify:grid labelled ACCEPT-EXIT-ONLY); `grep -a`; anchored `# TIMED OUT`.
  - A refusal anywhere is recorded in `REFUSALS.txt` and stops the queue at its next check; every helper's exit status is
    checked; backup-run is checked immediately before each call. backup-run's retry loop always stopped after the first try
    and a failed push passed silently (found while doing this); it now retries and reports a failed push.
  - final-tree-v4.sh stays in the directory, marked superseded and not approved; the queue is final-tree-v5.sh.
- **Real-suite smoke** (scratch working copy of these scripts, before this commit, at `592d629`, 10:50–10:52 AM ET): under
  the fixed environment npm run check, legacy-fsrc, boot-same and standards ran with exit 0, and the new gate ACCEPTED each on
  its exact verdict (the controls -- a wrong verdict, a wrong line order, another commit -- were REFUSED). audit-recon,
  audit-other and verify:grid were still running at this commit; their result is recorded with the self-test.

- **Self-test at `80b2d0b`** (frozen snapshot, 10:53 AM ET): 35/36. The one failure, A15, was the TEST's own fault: the
  self-test runs under the preamble, which exports `GIT_NO_REPLACE_OBJECTS=1`, so its own setup of the replace-ref attack
  never took effect ("trick not live") and the archive it froze was the genuine one, which the queue rightly accepted
  (stopping at the missing clone). Fixed in the next commit (the attack is built and shown live with that variable cleared,
  and the queue is launched with it cleared too), with one tidy-up in gate.sh (a NUL byte is dropped before the last-line
  check instead of drawing a bash warning; G11's outcome was already ACCEPT). The self-test is re-run at that commit.
- **Smoke, continued:** audit-recon exit 0 (98.4 s), ACCEPTED on `ALL CHECKS PASSED` as its last line.
- **Self-test at `0c189f0`** (frozen snapshot; bootstrap 10:54:43 AM ET, done 10:55:25 AM ET, exit 0): **36/36 PASS**. A1-A19
  provenance and environment (including the reviewer's attacks, each shown live first where it applies: R3 clean filter via
  GIT_CONFIG_*, R4 replace ref via GIT_DIR, E13 BASH_ENV, E14 exported git/python3 functions, R1 `..x`, R5 unreachable
  origin, a single unfrozen file, an unfrozen root, a link, a used outdir, a run through another shell, the preamble identical
  in all 9 scripts); G1-G17 the gate on logs written by run.sh (including E1b self-printed trailer, E11 orphan banner after
  the exit, E10 NOT ALL CHECKS PASSED, E12 SHELLOPTS monitor -- run.sh now records the suite's real exit 1 -- and the NUL and
  "TIMED OUT" texts accepted without a false refusal). All 15 recorded PIDs were gone afterwards. Evidence:
  `evidence/runner-0c189f0/selftest/` (BOOTSTRAP.txt is the full command; the 80b2d0b run is kept as superseded).
- **Independent re-review of `0c189f0`** started at 10:55 AM ET (background; same rules as the first review).

## Update at 11:32 AM ET: runner correction 2b; verify:grid fails at every commit in this container (U28)

- **Smoke, end:** verify:grid at `592d629` exited 1 (361.1 s); gate.sh REFUSED it, rightly. The failure is layout-fits.mjs
  section J: six checks, row R019's "$123,456,789" cut in its cell at widths 761-1023 px (rank, fund, brief; harbor and
  parchment). **Not the runner's environment:** layout-fits alone gave the same six failures under the old inherited
  environment (no LANG), with LANG=C.UTF-8, and under run.sh's fixed environment (11:01-11:09 AM ET). **Not a v2.00
  change:** the same six at `1c94537` (reset base), `3aeda74`, `4a6f7c7`, `a8891e1`, `f9b4413` (main) and `f81e954`
  (v1.91, which added the check), 11:09-11:28 AM ET. Opened as **U28** (ledger); evidence
  `evidence/runner-0c189f0/layout-verify-grid/` and `smoke-592d629/ab/`. No fix proposed or made.
- **Independent re-review of `0c189f0`** (10:56-11:24 AM ET; `evidence/runner-0c189f0/review-VERDICT.md`): **not approved**,
  one must-fix: **M1** the verdict-last rule REFUSES every passing audit-inject baseline (it prints a 96-character `=` rule
  after its banner; reproduced from a real passing log and end to end). Requirements 1-4 MET in normal operation; earlier
  M1, M2, S2, S4, S6, S7, S9 fixed. Should-fixes: S1 a preset RUNNER_ENV_CLEAN marker skips the env -i clean-up (and repo
  grafts can fake the backup check); S2 a suite's own leftover process can rewrite the log and its record; S3 FIRSTFAIL and
  RUNNER_LOCK pass from the launch shell into the queue; S4 backup-run commits the whole index and treats a busy index as
  "nothing new"; S5 self-test labels and gaps; S6 lanes keep running after a refusal and a stop is not backed up; S7 CRLF
  and trailing-space false refusals; S8 an outdir with a space or % is falsely refused; S9 Chromium escapes recorded-group
  cleanup (documented); S10 alone-run's quiet wait is unbounded. Its own self-test re-run: 36/36. It found no evidence the
  fixed environment breaks the suites.
- **Runner correction 2b** (this commit; records only): **M1** every baseline is gated on its suite's real ending from ONE
  table, `verdicts.tsv`, used by the queue and the self-test (audit-inject: the rule line, with ALL CHECKS PASSED before
  it); **S1** the second pass refuses any variable outside the allowlist (a preset marker no longer skips the clean-up),
  `GIT_GRAFT_FILE=/dev/null` in provenance git, `python3 -I -S` for blob ids; **S2** run.sh ends the run's recorded process
  group before writing its record (a process that leaves the group on purpose is out of scope, now said in gate.sh);
  **S3** the queue clears FIRSTFAIL and RUNNER_LOCK and says so; **S4** backup-run stages and commits only its destination
  (`git commit --only`), and a busy index, failed commit or wrong branch is "backup FAILED" (exit 3, recorded), not a
  silent "nothing new" or a stop; **S6** each lane stops at its next suite after a refusal, and a stop or a signal is
  recorded and backed up (best effort); **S7** trailing spaces and CR are dropped before the whole-line match; **S8** the
  freeze check reads find -print0; **S10** the quiet wait is bounded at an hour (exit 5). New self-test cases: G18 every
  queue suite's real passing output (committed evidence logs) replayed and gated on verdicts.tsv, and audit-inject's on
  the old one-line verdict (must REFUSE); A20 a preset marker with a dirty environment; A21 FIRSTFAIL/RUNNER_LOCK cleared
  and said; G8 now shows the suite's leftover ended with the run, G8b a line written after the record. Not in the
  self-test: a full queue run past the clone check (it would back up to orbit-board and take the live lock); the review's
  end-to-end harness covers it.
- **11:34 AM ET:** self-test at `706f721` (frozen snapshot; 11:33:10-11:33:58 AM ET, exit 0): **41/41 PASS**, including G18 (all 13 queue
  suites' real passing outputs ACCEPTED on verdicts.tsv; audit-inject's REFUSED on the old one-line verdict), A20, A21, G8
  and G8b. Its log carried git's "grafts are deprecated" hint once per provenance call (`GIT_GRAFT_FILE=/dev/null` triggers
  it; harmless, never in a suite log). This commit silences it (`-c advice.graftFileDeprecated=false` in provenance git)
  and nothing else; the self-test is re-run at this commit and the runner goes to an independent re-review.
- **11:35 AM ET:** self-test at `60c984c` (frozen snapshot; 11:34:42-11:35:30 AM ET, exit 0): **41/41 PASS**, no git hints. Evidence
  `evidence/runner-60c984c/selftest/` (with the G18 replays of the 13 real suite endings). **The runner to review and use
  is `60c984c621846fb3fd1eec002dda97815399f82b`.** Independent re-review started.

## Update at 3:03 PM ET: second usage-limit stop and container restart

- At 11:57 AM ET (the failed agents' transcripts were last written 11:57:46-11:57:58 AM ET; this line first said "from
  about 11:40 AM ET", unchecked, and is corrected here) agents failed with "session limit, resets 7pm (UTC)": UI fix:M1#2 (mid-way: it had committed
  58803c9..5a298b7 on claude/v200-ui and left an uncommitted CHUNK3.md edit) and verify:M1#3; safety verify:U1-U14#2; triage
  check:U17, check:U20, check:U24; the third runner re-review (of 60c984c). The container restarted at 3:01:38 PM ET. Nothing
  committed was lost; scratch, both UI worktrees and the bundles are intact. The UI bundle at 5a298b7 was backed up and
  restore-verified at 3:02 PM ET (7effa5e).
- Finished before the stop: U13 review #2 on the committed head, **no must-fix** (one should-fix: a builder README heading names a
  time later than the clock); U1/U14 fix round 2 (U14 test gaps: switching a year off, and "only"), 10:30-11:10 AM ET; triage
  probes U17, U19 (and its checker), U20 and U24, all REPRODUCED on 63bd8b0 in the scope given in each README (rec/L4/u17, u19,
  u20, u24). The failed agents are being re-run from their workflows' run ids (finished agents are not re-run).
- Resumed at 3:03-3:04 PM ET (this line first said "3:04-3:05 PM ET" in a commit made at 3:04:26 PM ET, a time later than the
  clock; corrected) : the three workflows from their run ids (only the failed agents re-run; the M1 fix-round retry is
  told what its stopped run had already committed and left uncommitted, and not to redo or amend it), and the runner re-review
  of 60c984c as a fresh agent (rec/L5/review-runner3b).

## Update at 3:37 PM ET: runner correction 2c (the review of 60c984c did not approve it)

- **Review of `60c984c`** (the retry, after the stopped attempt; `evidence/runner-60c984c/review-VERDICT.md`): **not approved**,
  one must-fix; all four requirements MET; all 13 gated suites match their real endings (audit-ui read at claude/v200-ui
  5a298b7); no false refusal of a good baseline found; no refusal that fails to stop the queue; its self-test re-run 41/41.
  **MF1:** the queue's own summary (`summary-all.txt`: the provenance line, the baseline decision, INCOMPLETE, DONE and every
  STOPPED line) never reached the backup -- backup-run copied only summary.txt, OVERLAP.txt and REFUSALS.txt (dates back to
  v4). Should-fixes: SF1 a signal stop left both lanes running every remaining suite; SF2 a refusal in the queue's own shell
  skipped stop(); SF3 a refusal could leave overlap-watch polling forever; SF4 the queue exited 0 when its backups failed;
  SF5 stop() backed up only the suites directory; SF6 a repo-local `insteadOf` (a write to orbit-board's config) could make an
  unpushed commit pass the backup check; SF7 backup-run's post-commit check read HEAD, not its own commit; SF8 alone-run
  removed the shared lock whoever set it; SF9 mutant `.json` files were never committed (orbit-board ignores `*.json`); SF10
  small items (preamble refusals not recorded; an empty verdict shown when a gate refusal happens in a lane; quiet()'s message
  time; self-test gaps).
- **Runner correction 2c** (this commit; records only): MF1 backup-run copies the queue's records (summary-all.txt,
  runner-blobs.txt, blobs.txt, manifest.tsv, applicability.json.txt); SF1/SF5 stop() ends both lanes and the foreground step,
  ends every recorded run with no exit record (by its recorded group), writes STOPPED, and backs up suites, import and the
  sensitivity stage in progress, and long steps are waited for in the background so a signal is handled at once; SF2 a
  refusal in the queue's shell goes through stop(); SF3 alone-run checks sens-import before starting the watcher and ends the
  watcher on any exit, and the watcher gives up after 120 s if the run never starts; SF4 exit 6 if any backup failed; SF6
  origin read at its fixed URL from outside any repository with no config, and never fetched by the runner (if the tip is
  not local it refuses and says to fetch); SF7 the check reads the commit backup-run made and its parent; SF8 alone-run never
  removes a lock it did not set and waits while another's exists; SF9 mutant JSON stored as `.json.txt` (the ignore rule is
  deliberate: a stray board-state file must stay unstageable); SF10 preamble refusals recorded, a lane's refused verdict
  says so, quiet()'s start time. The self-test still does not run the queue past the clone check (so not its stop, signal or
  backup paths); the review's end-to-end harness does.
- **3:38 PM ET:** self-test at `cccb714` (frozen snapshot; 3:37:29-3:38:13 PM ET, exit 0): **41/41 PASS**. Evidence
  `evidence/runner-cccb714/selftest/`. Independent re-review of `cccb714` started.
- **3:39 PM ET:** the resumed workflows replayed less from cache than expected (a workflow resume replays only the longest unchanged
  prefix of agent calls): the safety workflow re-ran U13's review on the committed head (again **no must-fix**; should-fix: the
  base guard is tested on one route only) and started U1/U14's first fix round a second time, although that round already
  ran 10:30-11:09 AM ET. That agent was told to verify the earlier fixes and not redo them. Triage checkers: **U17 agrees
  (REPRODUCED)**, disputing the builder's attribution of SHd/SHdk/FSHd to the save; **U20 agrees (REPRODUCED)**; U24's checker
  is running. The UI M1 fix-round-2 retry (with its resume note) is running.

## Update at 3:58 PM ET: U1 and U14 committed; triage outcomes; U29-U31 opened

- **U1/U14 review.** The round-3 adversarial review of fix round 2's bytes (11:12-11:58 AM ET; its agent stopped at the usage
  limit after writing `VERDICT.md`, kept as `evidence/L3-u1-u14/review-round3-VERDICT.md`): **sound, with issues; no must-fix.**
  Its should-fix 1 (three narrowing routes no U14 check takes; the product right on all three) has drafted checks (S5e) set
  aside, unapplied, for Brad. The resumed fix-round agent confirmed both round-2 must-fixes fixed and the deliverables
  byte-identical (3:03-3:43 PM ET). The workflow's further re-review of the same bytes was stopped as redundant.
- **U1 COMMITTED `0b4144ad32b1056a0d26d5d4e90d716d5b480422`** (3:46:41 PM ET; parent `9ef4f28`): board `bc674ee5`, audit-recon
  `7224512f`, mutate `b71105e6` (each equal to the reviewed draft), NEXT-VERSION.md's U1 entry. Before committing: npm run check
  passed; mcount 1314/1314 once (text). Commit check on the committed content (git archive of parent and commit; the
  builder's mkfocused.py on the committed suite; runner.mjs): U1 block 31/47 on the parent board, 78/0 after; both U1
  mutations caught (47, 33); R1 blocks 38/0 on both.
- **U14 COMMITTED `d66dd60fd4f205732e032c6c244409c480dba21c`** (3:48:35 PM ET; parent U1): board `fce8a391`, audit-recon `529e36f7`,
  mutate `cbc6defc` (each equal to the reviewed draft), NEXT-VERSION.md's U14 entry and both Unresolved lines. npm run check
  passed; mcount 1328/1328 once. Commit check: U14 block 63/0 after, 23/40 on the U1 commit, 19/44 on the pre-U1 board (U1
  31/47 there); all 14 U14 mutations and both U1 mutations caught. Evidence: `evidence/L3-u1-u14/commit-check/`.
- **Triage (all on 63bd8b0; every checker agrees):** U17 REPRODUCED, only through U24's paths now (U13 closed all ten earlier
  routes); U19 REPRODUCED, data loss (five routes); U20 REPRODUCED on one route, now P1; U24 REPRODUCED for adoptShared,
  sharedArrived (folder) and bootTakeFile (file), not for importBoards, which IS counted (the ledger row was wrong). **New:**
  U29 adoptShared on a clean board is falsely clean with no save (file mode: data loss); U30 the older "taken as the base"
  path overwrites unasked with no second tab; U31 importBoards never marks this browser's record dirty. Ledger updated. No
  proposal applied.

## Update at 4:24 PM ET: runner correction 2d (the review of cccb714 did not approve it; 2c's self-test pushed two records commits)

- **Review of `cccb714`** (`evidence/runner-cccb714/review-VERDICT.md`): **not approved**, two must-fixes; all four requirements MET;
  the gate, run.sh and verdicts.tsv unchanged and right (all 13 endings, audit-ui at claude/v200-ui 90ccabf); no false ACCEPT,
  no refusal that fails to stop the queue, no false refusal of a good baseline; its self-test 41/41 (run in a private mount
  namespace over a scratch clone). **MF1, my fault: 2c's self-test wrote to orbit-board and origin.** Cases A6 and A21 stop at
  the clone check, and 2c's stop() backs up from there, into the fixed repository with the self-test's destination `x`: my
  41/41 run at 3:37 PM ET committed and pushed **`3b8bc73` (3:37:35 PM ET) and `ff0c335` (3:38:06 PM ET)**, "final tree STOPPED",
  records only, three files under `recovery/v200/evidence/x/suites/` (no product file; the allowed branch). History is not
  rewritten; this commit removes that directory. **MF2:** a failed npm run check (exit 5) never backed up summary-all.txt.
  Should-fixes: SF1 alone-run's failed backups not counted (DONE, exit 0, the baseline log never pushed); SF2 a run that
  registers just after a stop began escapes it; SF3 a signal waits for check, verify:grid, standards or a backup to finish;
  SF4 the watcher's 120 s give-up let an unwatched audit-import count as alone while PAUSE was held; SF5 following the
  "fetch it" advice gave a run whose every push was refused; SF6 a failed stop backup left no trace; SF7 minor items.
- **Runner correction 2d** (this commit; records only): MF1 stop() backs up only once the queue has started (clone and
  manifest accepted), and the self-test's new A22 asserts orbit-board's HEAD, origin's tip and the evidence tree are
  unchanged by the whole self-test; MF2 a failed check stops through stop() (backed up); SF1 alone-run exits 6 when a backup
  failed and the queue counts it; SF2 stop() repeats the end-runs pass until the lanes and the foreground step are gone, and
  alone-run runs sens-import in the background and ends it with itself; SF3 check, verify:grid, standards and every backup
  are waited for in the background; SF4 PAUSE time does not count toward the watcher's give-up, and an attempt the watcher
  did not record is repeated (UNWATCHED), never counted as alone; SF5 the launch refuses unless the local branch holds
  origin's tip (and refuses if /.git exists); SF6 a failed stop backup is recorded and printed. Not done: backup-run's
  post-commit check still reads HEAD (benign; next push carries it), stray empty dirs, `# cmd:` unchecked.
- **4:25 PM ET:** self-test at `e42cfb6` (frozen snapshot; 4:24:37-4:25:15 PM ET, exit 0): **42/42 PASS**, including A22 (orbit-board's HEAD,
  origin's tip and the evidence tree unchanged by the whole run; also confirmed by hand). Evidence `evidence/runner-e42cfb6/selftest/`.
- **4:42 PM ET:** **UI M1, review round 3** (after fix round 2: 58803c9 board fix to `2d1d855e`, e439683, b418340, 775903f, 5a298b7 tests,
  90ccabf CHUNK3.md): sound, with issues; **one must-fix, evidence only**: the committed screenshots were at `aac8574` (board
  `ba8d0204`), not the final board. Resolved by the lead: local commit `670c467` on claude/v200-ui retakes them with the committed
  script on `2d1d855e` (4:40:21 PM ET, exit 0): shots.json identical to the earlier set and to the reviewer's retake (paths and
  times masked); 13 of 19 PNGs byte-identical, the other 6 differ only in the window title strip (0 pixels below y = 90). Bundle
  at 670c467 backed up and restore-verified (`0960361`). **S1-S5** (Brad-approved, each its own commit, reviewed) started from
  the UI workflow with that resolution recorded; the builder is told U28 is a known container difference not to be "fixed".

## Update at 5:05 PM ET: runner 2d APPROVED by its review; correction 2e (process-cleanup safety)

- **Review of `e42cfb6` (runner correction 2d): APPROVED** (`evidence/runner-e42cfb6/review-VERDICT.md`): no must-fix; requirements 1-4
  MET; cccb714's MF1, MF2, SF1, SF3-SF6 fixed (all its e2e runs re-run; the clone-check stop leaves the scratch REPO and remote
  unchanged); SF2 fixed for runs that register within about 1 s; gate, run.sh and verdicts.tsv unchanged, all 13 endings
  match (audit-ui at 670c467); no false ACCEPT, no unstopped refusal, no false refusal of a real baseline. Its self-test from a
  new frozen snapshot against the real orbit-board was 41/42: A22 failed only because the lead pushed `efae245` (records) as it
  ran; the self-test itself made no commit or push. Should-fixes: SF-A a stop could TERM a stale recorded group (a renamed
  attempt's) whose PID had been reused by another process (shown with a decoy in a private PID namespace); SF-B a run
  registering more than about 1 s after a stop escaped; SF-C A22 fails on any other session's push; SF-D an audit-import under
  about 1 s is UNWATCHED (real runs are minutes; left as is); SF-E a TERM to alone-run alone released the lock while its run
  went on; SF-F, SF-G small.
- **Runner correction 2e** (this commit; records only), because SF-A and SF-E touch Brad's process rules: run.sh puts
  `RUNNER_RUNLOG=<log>` in the run's own environment, and a stop (`endruns_in`, now in the shared preamble) signals a recorded
  group ONLY if its leader still carries that run's RUNNER_RUNLOG -- a reused PID or a renamed attempt's stale record is never
  signalled (checked live: the real run ended with exit 143; a decoy record and a wrong-log record were left alone); a stop
  looks for late runs three times after its wait (SF-B); alone-run ends its own recorded runs before it releases the lock, and
  only once its outdir is known (SF-E); A22 now fails only on a commit the self-test could have made (a "final tree" backup or
  anything under evidence/x), not on other sessions' pushes (SF-C).
- **5:06 PM ET:** self-test at `2bfb590` (frozen snapshot; 5:05:29-5:06:08 PM ET, exit 0): **42/42 PASS** (A22: 0 queue commits, 0 under
  evidence/x, origin read, evidence status same). Evidence `evidence/runner-2bfb590/selftest/`. The reviewer that approved 2d is
  asked to check the 2e delta.
- **5:17 PM ET:** **2e delta review: approval stands, no must-fix** (appended to `evidence/runner-e42cfb6/review-VERDICT.md`). SF-A fixed (a decoy
  holding a stale record's group id left alive in a PID namespace; a group carrying the run's own RUNNER_RUNLOG ended); SF-B
  narrowed (late runs at +1.7 s now ended; a 4.6 s start-up still escapes, so the margin is about 4 s); the extra variable breaks
  nothing (fake queue DONE with every baseline ACCEPT; real npm run check, legacy-fsrc, boot-same ACCEPT); endruns_in matches
  exactly (no prefix collision; spaces, * and [ab] handled); SF-E fixed; SF-C fixed (two nits). **The runner to use is
  `2bfb59022ec74e1abe36a7cfd6a13ce5aabd9aed`** (blobs in `bin/BLOBS.md`). The final-tree queue stays held until the selected changes
  are integrated and pinned.

## Update at 5:53 PM ET: Brad: "Don't wait for me. Let's keep pressing throughout to get this next version published."

- **How the lead reads it** (said to Brad): holds that existed only to wait for Brad lift -- the integration plan (a local,
  unpushed integration branch; `--no-ff` merges of claude/v200-fixes-wip and claude/v200-ui, every commit kept; a restore-verified
  bundle; pin; the final-tree queue ONCE from runner `2bfb590`) goes ahead, and the presweep, full gate and 135-mutation lane
  run after the matrix without waiting for his review. The lead now decides the release blockers rather than leaving them
  waiting. **Still gated:** the publish step itself (a PR or merge to main, claude/orbit-v2.00), asked once at the end without
  stopping any work before it.
- **Release blockers, decided by the lead** (the can't-fails are data loss and money): U19; U20 then U30; U24, U29 (U17) and U31;
  U18; U3 and U4; U9; U10; and an investigation of U28. Decision principles given to every builder: never lose any copy of
  anyone's work (keep both and ask or say); refuse or ask rather than guess; money and every export exact; words stay true;
  the smallest change; every existing expectation preserved or listed. Not taken as blockers (P2/P3 wording or state, to
  stay in the ledger and the release notes unless time allows): U5-U8, U15, U16, U21-U23, U25-U27.
- **Started:** fix workflows "save" (U19, U20/U30, adoption, U18, hold; `wf_8989967b-7b5`) and "math" (U9, U10, U28;
  `wf_03203484-33b`), from a read-only base of HEAD's product (`rec/L6/base`: board fce8a391). Each track: a builder on cumulative
  scratch copies, two independent adversarial reviewers per round (data loss and money; test adequacy), up to three fix
  rounds. The lead commits each fix separately, rebasing in turn; one full audit-import run alone on the combined drafts
  before integration. The UI S1-S5 workflow continues (S1, S2, S3, S5 built; S4 in progress).

## Update at 7:33 PM ET: Codex's cycle-export cases added; the fix workflows were stopped by a usage limit and restarted

- **Brad, about 6:05 PM ET (verbatim):** "Add Codex's two cycle-export P1 cases to the blocker workflow: * Duplicate `K1`
  registry entries. * One registry entry named `__none__`. Both accept an imported cycle and export USAF $1,800 / ANG $400
  from independently expected $900 / $200. Preserve those expectations, include ordinary-key controls, and verify actual
  XLSX after import and reopening. Also record the malformed saved-year selection and pending registry-text findings
  explicitly. If deferred, name their limits in the matrix and release notes. Keep U20/U29–U31 open. Provide their raw
  reproduction, recovery and control logs alongside the final matrix; the status summary alone doesn't establish
  independent verification. Continue the approved workflows. Preserve separate safety/UI commits, complete UI-C1's checks
  after integration, and pin the combined tree before final validation."
- **Ledger:** U32 (duplicate `K1`) and U33 (an entry named `__none__`) were added as **P1, money**, with Brad's literals
  kept (USAF $900, ANG $200 expected; $1,800 / $400 exported). Both are by code at `d66dd60`: `monSheet` walks the
  registry's keys and adds a listed key's bag once per listing, and its not-assigned bucket is the string `__none__`. Neither
  is reproduced here yet. U34 (the malformed saved-year selection) and U35 (the pending registry-text findings; Codex's
  text has not reached the lead) are recorded and not yet measured. If any of them is deferred, the evidence matrix and
  NEXT-VERSION.md's "Not covered" will name its limits. U20 and U29–U31 stay open.
- **Codex tracks.** A third group was added to the fix workflow (`wf_882701ab-22b`, from 6:13 PM ET) with three tracks:
  - **cycreg (U32, U33):** reproduce through the product's import, then refuse at import and count each key once at
    export. It reads the actual XLSX after import and after reopening, with ordinary-key controls.
  - **yearsel (U34):** probe each malformed shape; fix if clearly right, else state the limits.
  - **regtext (U35):** every way registry text enters and leaves.
- **Stopped by a usage limit.** All three fix workflows stopped between 6:16 and 6:18 PM ET, when every builder hit the
  session usage limit ("resets 12am (UTC)", i.e. 8:00 PM ET). This was not a defect, and no builder returned a result.
  - Partial work was left in `rec/L6/<track>`:
    - u9 and u10: a fix on c1, with focused runs under way.
    - u19: its fix in progress.
    - u20u30: c1 and c2.
    - cycreg: only its folders.
  - adopt, u18, hold, u28, yearsel and regtext had not started.
  - The UI S1–S5 review kept running; its reviewer was active at 7:27 PM ET.
  - At 7:30 PM ET the lead checked that no process of the stopped builders was still running. The only node or Chromium
    processes were the UI reviewer's.
- **Restarted at 7:31 PM ET** with the same tracks and one added instruction: continue from the track's folder, and re-run
  any step whose log has no exit record. The new runs are save `wf_12f3bad9-2bc`, math `wf_041e5055-bb1` and codex
  `wf_66312e0c-108`.
- **Raw logs.** The triage folders behind U17, U20 and U24, and behind U29, U30 and U31, are stored as written in
  `evidence/triage-63bd8b0/`, together with the independent checkers' folders (`*-check`).
  - Board files (`*.html`, 16) and symlinks (8) are left out and listed with their sha256 in `EXCLUDED.txt`.
  - Working copies of 63bd8b0 and a8891e1, which are byte-identical by git blob id, are replaced by `TREE.txt`.
  - `MANIFEST.sha256` covers the 2,253 stored files and was checked with `sha256sum -c`.

## Update at 11:14 PM ET: overnight, second usage-limit stop, all workflows resumed

- **Brad, about 8:40 PM ET:** "I'm about to go to sleep I need you to ensure that you continue to keep going after my
  tokens and usage reset throughout the night." The lead set an hourly check-in (routine `trig_01PhhHK97YTPeEsCZr3X2fvw`,
  at 42 minutes past each hour). It fires into this session and restarts any workflow a usage limit stopped, with
  `resumeFromRunId`. It is to be turned off when the work reaches the publish question.
- **Drafts finished before the stop** (builders; not yet reviewed, nothing committed):
  - U9: the exact PMO split.
  - U10: a refused locked-cycle edit changes no code.
  - U19: put back after a board-file save keeps what it replaces.
  - U20 and U30: two commits.
  - U32 and U33 (cycreg): **reproduced** through the product's own import, with the XLSX read from its bytes. Both of
    Codex's shapes exported USAF $1,800 / ANG $400 / all services $2,200 against the hand-worked $900 / $200 /
    $1,100. Ordinary-key controls gave $900 / $200 / $1,100.
  - U34 (yearsel): reproduced. Malformed selections are read as ALL YEARS or as a year the file does not name, with
    nothing said.
  - Registry text (regtext): a new finding, **U36**. A typed RCN / EEIC title over 80 characters is cut to 80 without a
    word, and the cut can split an emoji. A fix is drafted. Codex's own registry-text items (U35) have still not reached
    the lead.
  - U28: **root cause found, container-only.** `/etc/fonts/conf.d/56-prefer-inter.conf` in this container (dated 3 Oct,
    installed by no package) maps 'Segoe UI' to Inter. Chromium then draws the money cells in Inter Bold, which is 14.6%
    wider than Arial's widths, and that accounts for exactly the six failures. No user's browser draws Inter for
    'Segoe UI'. No board change is proposed.
- **The one review that returned before the stop:** U9, data-loss/money lens: "sound, with issues". Its one must-fix is
  text only: the drafts leave out a fully funded case that shows the U9 symptom on the mandatory lane. The UI S1–S5 review
  (round 1, "sound, with issues", S4's docked coverage) led to a fix round. Before the stop, that round made eight local
  commits on claude/v200-ui, `e950efe`..`8783a2d`, between 7:57 and 8:29 PM ET.
- **Stopped at about 8:47 PM ET.** Every running builder and reviewer hit the session usage limit ("resets 3:10am
  (UTC)", i.e. 11:10 PM ET). Each workflow then ran through its remaining review rounds with failed reviewers and ended.
  Nothing was lost on disk. The 9:42 and 10:42 PM ET check-ins were delivered when the session came back.
- **11:11 PM ET:** the container restarted; the scratch work and both repositories were intact. At 11:13 PM ET all four
  workflows were resumed under their own run ids (save `wf_12f3bad9-2bc`, math `wf_041e5055-bb1`, codex
  `wf_66312e0c-108`, UI `wf_d5c82278-87a`), and finished agents replayed from cache. Resume notes were added only for
  agents that had not finished: the adoption, U18 and hold builders, and the UI fix round, which is told to keep its eight
  commits and not redo them.
- **UI backup:** claude/v200-ui at `8783a2d`, bundle commit `a5e8fba`, restore verified.
- **Dry run of the commit sequence** (scratch clone `rec/L7/merge`, `rec/L7/apply.sh`): U9, U10, U19, cycreg and
  yearsel applied in turn onto `60336a0`. The board merged cleanly every time. The only conflicts were add/add test
  insertions at the same anchor (resolved as ours + theirs; every base side was empty). mcount gave 1,365 / 1,365 once on
  the combined board (text only). This is not a commit check; each fix is checked when it is committed.
- **Time correction (the lead's own error).** The hourly routine's stored prompt, written at 8:42 PM ET, gave Brad's
  message as "about 8:45 PM ET", which was later than the clock. The message arrived between 8:39 and 8:42 PM ET. The
  prompt was corrected to "about 8:40 PM ET" at 11:15 PM ET. No repository record carried the wrong time.

## Update at 4:14 AM ET: third usage-limit stop overnight; resumed

- **Between 11:13 PM and 12:50 AM ET:** round-1 reviews returned, by lens (data loss and money / test adequacy):
  - U9: 1 must-fix / 1 must-fix.
  - U10: 2 must-fix from the money lens.
  - U28: 1 must-fix from the money lens.
  - U32/U33 (cycreg): **unsound** on both lenses, 3 and 2 must-fix. A number key `1` beside the text key `"1"` still
    passes the import and doubles the export, and two changed money paths have no failing check on the base.
  - U34 (yearsel): 1 must-fix / clean.
  - U36 (regtext): 2 must-fix from the money lens.
  - Built: the adoption track (U24, U29, U31: three commits) at 12:01 AM ET and U18 at 12:28 AM ET.
  - UI: the S1–S5 fix round finished at 12:22 AM ET, ending at `dd15956` (bundle `321ac94`, restore verified). Its
    re-review was under way.
- **About 12:49–12:53 AM ET:** every running agent hit the usage limit ("resets 8:10am (UTC)", i.e. 4:10 AM ET). The fix
  rounds then in progress (U9, U10, cycreg, yearsel, regtext, U28), the hold builder and several reviewers stopped. The
  check-ins at 1:43, 2:42 and 3:42 AM ET were delivered when the session came back.
- **4:11 AM ET:** the container restarted, and the work on disk was intact. At 4:13 AM ET all four workflows were resumed.
  Resume notes were added only for agents that had not finished: fix rounds (continue a stopped round from the track's
  folder) and the hold builder.
- **Cache note:** a resume replays finished agents only along the longest unchanged sequence of calls, and the tracks in a
  group interleave. So two finished round-1 money reviews (U10, U34) are running again as fresh reviews. That costs time
  but no correctness. The lead is preparing a resume that feeds finished results in explicitly.
- No draft has a clean review yet, so nothing has been committed.
