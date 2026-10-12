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
