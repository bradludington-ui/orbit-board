# VERDICT: ORBIT runner correction 2d, e42cfb6 (independent adversarial review)

- **Reviewed:** `e42cfb657c9de7000bb87200f59484226afd4b73` on claude/v200-fixes-wip ("runner correction 2d"), `recovery/v200/bin/` only.
- **Measured against:** the review of cccb714 (`recovery/v200/evidence/runner-cccb714/review-VERDICT.md`, MF1, MF2, SF1-SF7) and Brad's
  four requirements.
- **When:** review work ran from 4:25 to 5:01 PM ET, 12 Oct 2026 (Eastern, from the clock). Written from 5:01 PM ET.
- `$W` below = `/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L5/review-runner5`.
- **Harness:** the cccb714 reviewer's e2e harness, copied to `$W/e2e` with paths changed. It is e42cfb6's `bin` with REPO and ORIGIN set to a
  scratch repo and bare remote, a scratch lock dir, and the same control files (foreign/overlap PID lists, quiet bound, `ctl/wbound`).
  `diff -r` against e42cfb6 shows only those lines. The scratch REPO carries e42cfb6's `.gitignore`.
  - **One harness change was forced by 2d.** The fake audit-import now sleeps 3 s (`ctl/audit-import.sleep`). At 0.1 s the 1 s watcher never
    sees it, so every attempt is UNWATCHED (run1, below).

## Bottom line

**APPROVED for producing validation evidence. There is no must-fix. Seven should-fixes; the top three are short.**

- **cccb714's findings.** MF1 and MF2 are fixed. SF1, SF3, SF4, SF5 and SF6 are fixed. SF2 is fixed for the timing that was reported, but not
  in general (SF-B below).
- **The gate is unchanged.**
  - gate.sh, run.sh, sens.sh and sens-import.sh bodies are byte-identical to cccb714 apart from the preamble. verdicts.tsv is unchanged.
  - I found no way for it to ACCEPT a run that did not finish and succeed.
  - Every refusal I caused stopped the queue, including one raised inside a `fgw runs` background subshell (run28).
- **No false refusal of a real baseline.**
  - All 13 suites still match their real endings (G18, 13 ACCEPT).
  - audit-ui at claude/v200-ui (now `670c467`) still ends with the rule, `ALL CHECKS PASSED`, then `process.exit(0)`.
- **My self-test re-run** (new frozen snapshot, no mount namespace, the real orbit-board) is **41/42**.
  - Rows A1-G18b match the lead's, row for row.
  - **A22 FAILED because the lead pushed `efae245` during the run**, not because of the self-test (SF-C).
  - orbit-board shows no write by the self-test: no commit, no push, evidence tree unchanged.

**New defects in 2d (all should-fix):**
- a stop TERMs stale, possibly reused, process groups (SF-A, reproduced with a decoy);
- a run that registers more than about 1 s after a stop still escapes it (SF-B);
- A22 fails whenever anyone else pushes during the self-test (SF-C);
- the UNWATCHED rule turns any sub-second audit-import into "three overlapped attempts" (SF-D).

| # | Requirement (Brad, verbatim) | Verdict |
|---|---|---|
| 1 | "Pin a full backup commit SHA and run all helpers from a verified, frozen task-local snapshot of that commit." | **MET.** <ul><li>The 40-hex pin, snapcheck, the whole-root freeze and `vh` are unchanged.</li><li>`backedup` is stricter: it adds the `/.git` guard, and REPO's branch must hold origin's tip (run22/22b/22c).</li></ul> |
| 2 | "Verify provenance before executing any helper, including mkmanifest. Make alone-run derive helper paths from its own snapshot directory." | **MET.** <ul><li>The new `fgw` wrappers keep `vh` immediately before each execution: `runs` checks run.sh inside the background subshell (refusal caught, run28), and `bk` runs `vh backup-run.sh` before `fgw`.</li><li>mkmanifest is still checked first (v5:145).</li><li>alone-run and sens-import still take `B` from `$0`.</li></ul> |
| 3 | "Require recorded exit 0, the suite's successful completion verdict, and no timeout/interruption before authorizing sensitivity runs." | **MET.** <ul><li>The gate bodies are unchanged; `passed()` re-gates each baseline.</li><li>Runs ended by a stop record 143, or no exit at all; neither is gated.</li><li>Runs that escape a stop (SF-B) finish after the queue has exited, so nothing gates them.</li></ul> |
| 4 | "Add bounded refusal checks for an altered helper and for a success banner followed by a nonzero exit or timeout." | **MET.** <ul><li>A1-A3, G1, G2 and G10 are present, bounded and PASS in my run.</li><li>A6 and A21 no longer write anything (pre-flight and real run).</li><li>Caveat: the new A22 makes the self-test's exit status depend on other sessions' pushes (SF-C). My run exited 1 for that reason alone.</li></ul> |

## MUST-FIX

None.

## SHOULD-FIX (priority order)

### SF-A. A stop TERMs stale process groups: renamed attempts' recorded PIDs, which can be reused (pid_max is 32768 here)

- **Mechanism.**
  - When alone-run renames an attempt's log (`BASELINE-OVERLAPPED-n.log`, and new in 2d `-UNWATCHED-n.log`), pids.txt still names
    `BASELINE.log`.
  - `endruns` then finds no `BASELINE.log.exit` and sends `kill -TERM -- -<that PID>`.
  - That PID belongs to a run that ended minutes earlier.
  - It happens on every stop during attempt 2 or 3, and after alone-run exit 4.
  - 2d calls `endruns` up to 12 times per stop.
- **Why it matters here.**
  - `/proc/sys/kernel/pid_max` is 32768, and this machine went through about 32k PIDs between about 3:00 and 4:55 PM ET, so PIDs wrap during a
    multi-hour queue.
  - Every Bash-tool shell here is a session and process-group leader (`ps`: PID = PGID = SID). A reused PID can therefore be another
    session's long command, or the lead's.
- **Reproduction.** `$W/e2e/run27-inner.sh`, run as PID 1 of a private PID namespace (`unshare -p -f --mount-proc`, via `bx.sh`; output
  `$W/e2e/run27.out`).
  - The BASELINE overlapped 3 times, so the queue reached exit 4 and `stop()`.
  - Before the stop, a decoy `setsid sleep` was created with PGID equal to attempt 1's stale recorded PID (719), using `ns_last_pid`.
  - Result: **"decoy (pgid = stale P1) KILLED; control decoy ALIVE"**.
  - Without a namespace, run1 and run19a/ctl show the precondition: `recorded runs without .exit: <3 BASELINE.log pids>` at the stop.
- **Rough odds.** About 0.1% per such stop on this machine. It predates 2d (2c's OVERLAPPED rename); 2d widens it.
- **Minimal fix.** In `endruns`, signal a recorded group only if its leader is still the recorded run, for example
  `[ "$(readlink /proc/$p/cwd 2>/dev/null)" = "$(readlink -f "$C")" ]`, or its start time matches the record.
  - Alternatively, name each attempt's log per attempt from the start (`BASELINE-a1.log`), so a rename never orphans a pids.txt line.

### SF-B. A run that registers more than about 1 s after a stop still escapes it; the final `endruns; sleep 1` does nothing

- **Mechanism.**
  - `stop()` kills the lanes and `$FG`. Those shells die at once, so the loop breaks after its first `sleep 1; endruns`.
  - It then runs `endruns; sleep 1`. The last `endruns` comes **before** the sleep, so a run that registers during that second is never
    ended.
  - A run.sh already forked survives its killed parent. If it records its PID later than about +1 s, it runs to its end after STOPPED.
  - The 2d comment "a run that registered just after the stop began is ended too" is not what the code does.
- **Reproduction.** run25a and run25b (`$W/e2e/run25.sh`, `run25a.out`, `run25b.out`).
  - The clone is `clone-slow`, whose jsdom version lookup (run.sh's header) takes 1.6 s.
  - TERM went to the queue as a lane log was created. The queue exited 3 at +2.3 s with STOPPED pushed.
  - **audit-hostile and audit-inject registered at +1.7 s and finished exit 0 at +7.7 s**, after the queue was gone. They are not on the
    remote.
  - With normal start-up (about 0.3 s), runs 17a-c and 18a-c are ended at +1.0 s (fixed, as claimed).
- **Why it matters.** It needs a slow start-up, so it is rare.
  - An escaped audit-import runs unlocked, because alone-run's EXIT trap has already removed the lock (see SF-E).
  - foreign() and overlap-watch both ignore processes whose cwd is the clone. A relaunch on the same clone would therefore not see a
    leftover run as an overlap.
  - **Operational note until fixed:** after any STOPPED queue, check that no node process runs in the clone before relaunching.
- **Minimal fix.** Make the end `sleep 1; endruns` (this widens the margin to about 2 s).
- **Robust fix.** Close the race entirely.
  - Export `RUNNER_STOP=$O/STOP` (add it to the preamble's kept list).
  - Have run.sh refuse to start, immediately before `setsid … &`, when that file exists.
  - Any run.sh that passes the check then records within milliseconds and is ended by the next `endruns`.

### SF-C. A22 fails whenever another session commits or pushes during the self-test

- **Mechanism.** A22 compares orbit-board's HEAD and origin's tip before and after the whole run (about 35 s). It cannot tell the
  self-test's writes from anyone else's.
- **Reproduction, twice.**
  - **My pre-flight** (namespace, scratch clone): the lead pushed `0960361` at 4:41:51 PM ET.
    - "origin MOVED 0bf4798… -> 0960361…": A22 FAIL.
    - A21 also failed: the scratch clone lacked the new tip, so `backedup` refused before the clone check. That part is specific to the
      pre-flight.
  - **My real run:** the lead committed and pushed `efae245` (RUNNING-CHECKS.md only) at 4:42:28 PM ET, as the run started.
    - "HEAD same; origin MOVED '0960361…' -> 'efae245…'": **41/42, exit 1**.
- **Side effect.** A22's `git -C "$REPO" status` takes orbit-board's optional index lock. That can collide with a concurrent commit by the
  lead.
- **Minimal fix.** Assert what only the self-test could do.
  - No commit in `H0..H1` (and `O0..O1` when local) touches `recovery/v200/evidence/x`, and none is titled "final tree STOPPED".
  - A6 and A21 each find "(stopped before the queue started: nothing backed up, orbit-board untouched)" in their summary.
  - Use `git --no-optional-locks status`.

### SF-D. The UNWATCHED rule: a sub-second audit-import is never watched, and is reported as "three overlapped attempts"

- **Mechanism.**
  - The watcher polls for `RUNNING` once a second.
  - In run1 (0.1 s fake suite), RUNNING lasted under a second, so all 3 attempts were UNWATCHED.
  - alone-run then exits 4 ("three attempts all overlapped"). The queue stops with "4 = three overlapped attempts", exit 4.
- **Real runs are not affected.** All 26 audit-import logs in the evidence tree took 471-596 s, and runs over about 1.1 s are always seen. So
  **no real attempt is falsely repeated, and a real baseline is not made impossible** (Q3).
- **What it does change.**
  - An audit-import that crashes at start (under about 1 s) now stops the whole queue with a wrong reason. Before, it was gated REFUSE and
    the other suites still ran.
  - Any e2e harness needs fake suites of 2 s or more.
- **Minimal fix.**
  - In sens-import, `touch "$O/RUNNING"; sleep 2` before the run. Or wait, bounded, for the attempt's "watch start".
  - Give all-unwatched its own message and exit code.
- **Related: the code does not match its comment.** alone-run's header says an attempt counts only if the watcher recorded its "start and
  end with nothing between". The code checks only `watch start`. Check `watch end` too, or correct the comment.

### SF-E. alone-run on its own: a TERM releases the lock while its audit-import keeps running

- **The claim.** 2d says "sens-import runs in the background and is ended with this script, so a signal stops the run at once".
- **What happens.** The EXIT trap kills only sens-import's shell; run.sh and the suite are separate processes.
- **Reproduction.** run29 (`$W/e2e/run29.out`): TERM to alone-run's own PID 1 s after its BASELINE registered.
  - At +1 s: "alone-run gone; lock ABSENT; run group STILL RUNNING".
  - The run finished exit 0 at +14.0 s, unlocked and unwatched, and left `RUNNING` in place.
- **Under the queue it is covered.** `stop()`'s `endruns` ends the run, subject to SF-B.
- **Who calls alone-run in v5.** Only the queue and self-test A2 (which refuses before the lock). So the impact is low.
- **Fix.** Before clearing the lock, the EXIT trap ends this script's recorded run (its `$O/$id.log` line in `$RUNNER_PIDS` without
  `.exit`). Or it keeps the lock until that run is gone.

### SF-F. Smaller items

- **Launch-time branch check.** `backedup` checks `refs/heads/claude/v200-fixes-wip`, not that REPO's HEAD is on it, which backup-run
  requires. A launch with orbit-board on another branch passes, then every backup fails (exit 6, hours later; compare run14). Add
  `[ "$(pg symbolic-ref -q --short HEAD)" = claude/v200-fixes-wip ]` to `backedup`.
- **SF1 remainder.** When alone-run's backup fails (run13), the queue says "DONE … with at least one FAILED backup (see above)", but its own
  summary has no line about it (the detail is only in import/summary.txt). On the DONE path no later backup covers `import/`, so the BASELINE
  log never reaches the remote. Retry `bk "$O/import" …` before DONE when alone-run exited 6, and say so.
- **Unkilled background job.** `kill $LANES $FG` misses a background job forked in the instant between `"$@" &` and `FG=$!`. It is
  theoretical; `kill $(jobs -p)` closes it.
- **TERM during the queue's own backup.** It now kills backup-run's shell mid-push (fgw), and the orphaned `git push` carries on alongside
  stop()'s backups. Run24 (12 s pre-receive) shows no harm: both landed, and the orphan ended before the queue (+28.5 s).

### SF-G. Carried from cccb714 SF7, not done (as 2d's notes say)

- backup-run still reads HEAD after its commit.
- REPO's config still decides where pushes go.
- `# cmd:` is still unchecked.
- `stop()` ignores TERM for the length of its backups.
- The self-test still has no case past the clone check.
- **Stray directories.** 2c's empty directories `recovery/v200/evidence/x/{suites,import}/{completed,mutants}` are still on disk in
  orbit-board's worktree. They are untracked and invisible to git; the lead can `rmdir` them. A failed `git add` leaves untracked copies in
  REPO (scratch REPO: `e2e/run13/import/`).

## Q1. cccb714's findings, and the e2e stop paths

For each run, "pushed" means `summary-all.txt` with its DONE or STOPPED line is committed on the scratch remote. It was byte-equal to the
local summary wherever checked.

| Run | Path | Exit | summary-all.txt pushed | Started after STOPPED | Alive after the queue |
|---|---|---|---|---|---|
| 1 | happy path, 0.1 s fake audit-import | 4 | yes (STOPPED) | — | none (3 stale BASELINE pids, SF-A) |
| 1b | happy path, audit-import 3 s | **0** | yes (DONE) | — | none; 13 baselines + verify:grid ACCEPT; 5 `.json.txt`, 0 `.json` |
| 2 | TERM during the lanes | 3 | yes | 0 (2 in flight ended, 143) | none |
| 3 / 4 | verdicts.tsv altered in a lane / sens.sh altered (main shell) | 2 / 2 | yes / yes | 0 / 0 | none |
| 5 | never quiet, someone else's lock | 4 | yes | — | none; the other lock kept |
| 7 | sens-import altered during quiet | 2 | yes | — | none; lock cleared |
| 8 | three TERMs, slow push | 3 | yes, 1 STOPPED | 0 | none |
| **9** | TERM during check | 3 | yes | 0 | none; **queue gone +2.4 s, check ended 143 at +0.0 s (SF3 fixed)** |
| 10 / 11 | TERM during BASELINE / during sens.sh | 3 / 3 | yes / yes | 0 | none; runs ended 143 at +0.0 s |
| 12 | TERM during alone-run's backup (8 s push) | 3 | yes | 0 | none; queue +16.4 s; both backups landed |
| **13** | alone-run's backup fails | **6** | yes ("DONE … FAILED backup; exit 6") | — | none; **SF1 fixed**; BASELINE.log still not on remote (SF-F) |
| 14 | every backup fails | 6 | n/a (all fail) | — | none |
| **17a-c** | TERM as a lane run starts | 3 | yes | 0 | none; **run ended 143 at +1.0 s (was exit 0 at +6.1 s)** |
| **18a-c** | TERM while sens-import prepares | 3 | yes | BASELINE never started | none; lock absent (checked at +4.3 s) |
| **19a / ctl** | PAUSE 8 s beyond a 3 s give-up / control | **4 / 4** | yes / yes | — | none; **19a: attempt 1 UNWATCHED, 2-3 OVERLAPPED; no ACCEPT (SF4 fixed)** |
| **20** | npm run check fails | **5** | **yes (MF2 fixed)** | — | none |
| **21** | TERM while backups fail | 3 | no (expected) | 0 | none; **"stop backup FAILED" ×2 in local summary and stderr (SF6 fixed)** |
| **22 / 22b / 22c** | origin ahead / after fetch only / after `pull --ff-only` | 2 / **2** / **0** | — / — / yes (DONE) | — | none; **22b now refused at launch; 22c: 0 FAILED (SF5 fixed)** |
| 23 | launcher `timeout -k 10 12` during check | 124 | yes | 0 | none (suite ended; run.sh died, no .exit) |
| 24 | TERM during the queue's own fgw backup push (12 s) | 3 | yes | 0 | none (orphan push ended first) |
| **25a-b** | as 17, with run.sh start-up 1.6 s | 3 | yes | 0 started after, **2 finished exit 0 at +7.7 s** | **those 2 runs, until +7.7 s (SF-B)** |
| **26a / 26b** | **clone-check stop** (`/nonexistent`, dest `x`) / manifest-check stop | 2 / 2 | not backed up (by design) | — | none; **scratch REPO and remote unchanged: HEAD, remote tip, index mtime, status, directories (MF1 fixed)** |
| 27 | exit-4 stop in a PID namespace with a decoy | 4 | yes | — | **decoy with stale PGID KILLED (SF-A)** |
| 28 | run.sh altered before verify:grid (refusal inside `fgw runs`) | 2 | yes | verify:grid never started | none |
| 29 | alone-run on its own, TERM | 143 | — | — | **run until +14 s, lock released at once (SF-E)** |

| cccb714 finding | Status | Evidence |
|---|---|---|
| **MF1** the self-test pushes STOPPED records into orbit-board | **Fixed** | <ul><li>`STARTED` gate; run26a/b leave REPO and remote unchanged.</li><li>Pre-flight (scratch clone) and real self-test made no commit or push.</li><li>`evidence/x` is removed from the tree (empty dirs remain on disk).</li><li>The new A22 is flaky (SF-C).</li></ul> |
| **MF2** check-failed stop never backs up summary-all.txt | **Fixed** | run20: exit 5, STOPPED and provenance pushed |
| **SF1** alone-run's failed backups not counted | **Fixed** (remainder in SF-F) | run13: exit 6, DONE says FAILED |
| **SF2** a run that starts just before a stop escapes | **Partly fixed** | <ul><li>Fixed for registration within about 1 s: runs 17a-c, 18a-c.</li><li>Still escapes later than that: run25a-b (SF-B).</li><li>alone-run on its own: run29 (SF-E).</li></ul> |
| **SF3** TERM waits for a foreground step | **Fixed** | run9; refusal propagation from `fgw runs`: run28 |
| **SF4** give-up lets an unwatched run count as alone | **Fixed** | run19a. New side effect: sub-second runs (SF-D). |
| **SF5** "fetch it" advice leads to a run whose every push fails | **Fixed** | run22/22b/22c |
| **SF6** a failed stop backup is invisible | **Fixed** | run21 (exit stays 3; acceptable) |
| **SF7** minor | **Partly** | `/.git` guard added; the rest open (SF-G) |

## Q2-Q4, briefly

**The STARTED gate (v5:150).**
- It is set only after the clone and manifest checks, in the main shell, and `STARTED=` is reset at v5:120, so the environment cannot
  preset it.
- Every stop before it (clone, manifest, mkmanifest, signal) backs up nothing and says so (run26a/b).
- Every stop after it backs up (runs 9, 20 onward).

**The repeated `endruns` loop.**
- It is bounded: at most 10 × (1 s + endruns) + endruns + 1 s.
- In practice it exits after 1 s, because the killed shells die at once (SF-B).
- When `$FG` is alone-run inside a long backup push, the loop gives up at 10 s and stop()'s backups run beside alone-run's. That is visible
  (stop backup FAILED) if they collide; run12 had no collision.

**alone-run.**
- The background sens-import, `wait $SI` and the EXIT trap end sens-import and the watcher, and clear only its own lock (runs 5, 7, 10,
  18).
- They do not end the run itself (SF-E).
- Exit 6 is produced only after every id completed (run13).
- The UNWATCHED rule: SF-D.

**overlap-watch's PAUSE-aware give-up.**
- It is correct: PAUSE time no longer counts (run19a).
- With the real 120 s bound against sens-import's 5 s PAUSE poll, it cannot fire because of PAUSE.
- If it does fire, the attempt is repeated, not accepted.

**`fgw` around `runs` and `backup-run`.**
- A signal is handled at once (run9, run24).
- A refusal inside the background subshell is recorded, caught by the `chk` that follows, and stops the queue (run28).
- `chk` follows every `fgw`.

**`[ $AX = 6 ]`.**
- It is correct in both places (v5:163, :187). Only alone-run's final line can produce 6.

**`backedup`.**
- `merge-base --is-ancestor "$tip" refs/heads/claude/v200-fixes-wip` refuses exactly the run22b case.
- It cannot falsely stop a run in progress: it runs once, at launch.
- It does not check HEAD's branch (SF-F).
- The `/.git` guard is sound. A bare repository at `/` (`/HEAD`, `/objects`, `/refs`) would get around it, but needs root writes.

**Gate (Q4).**
- No false ACCEPT: the bodies are unchanged, stops record 143 or no exit, and escaped runs are never gated.
- No refusal failed to stop the queue (runs 3, 4, 7, 28).
- No false refusal of a real baseline (G18 13/13; SF-D affects only sub-second runs).
- Endings: `tools/`, `package.json` and the board are unchanged from 9b10e2a to efae245.
- claude/v200-ui moved 90ccabf → 670c467 during the review (screenshots only). audit-ui.mjs there (1098 lines) still ends `console.log('\n' +
  '='.repeat(96)); if (!failures.length) { console.log('ALL CHECKS PASSED'); process.exit(0); }`, matching its verdicts.tsv row.

## Self-test re-run (Q5)

- **Pre-flight** (not the re-run): the lead's bootstrap in a private mount namespace with a scratch clone over orbit-board (`$W/PREFLIGHT.txt`,
  `$W/preflight-e42cfb6/`), to make sure the real run would write nothing.
  - The scratch clone and its remote were byte-unchanged (`$W/preflight-state.txt`).
  - 40/42: A21 and A22 failed because the lead pushed `0960361` mid-run (SF-C).
- **The re-run.** The lead's bootstrap with my directory, **no namespace** (`$W/BOOTSTRAP.txt`), under `bx.sh` (recorded group).
  - **Snapshot.** A new frozen snapshot of e42cfb6 at `$W/selftest-e42cfb6/runner`; its own snapcheck verified 26 files.
  - **Ran:** 4:42:28-4:43:02 PM ET.
  - **Result: `1 failing case(s) of 42`, exit 1.** Rows A1-G18b are PASS and identical to the lead's `results.tsv` (`$W/lead-results.tsv`).
  - **A22 FAIL:** "HEAD same; origin MOVED '0960361…' -> 'efae245…'".
- **orbit-board is unchanged by the self-test** (`$W/orbit-selftest-state.txt`, `$W/orbit-commits-during-selftest.txt`).
  - The only commits in the window are the lead's `0960361` (ui-backup) and `efae245` (RUNNING-CHECKS.md only).
  - No commit since e42cfb6 touches `evidence/x` or is titled "final tree STOPPED".
  - Unchanged: the evidence-tree directory hash and status, config, hooks (samples only) and info (only `exclude`).
  - The index mtime moved to 20:42:29 UTC. That is the lead's commit, or A22's own `git status`; either way, no content changed.
- **Mount namespace.** It is no longer needed.

## Artifacts (all under $W)

| Path | What it holds |
|---|---|
| `VERDICT.md` | This file |
| `pids.txt` | Every group I started (via `bx.sh`; 43 lines, including the foreign sleeps). Run PIDs are in each `e2e/out-*/pids.txt` and `selftest-e42cfb6/pids.txt`. **None alive at 4:58 PM ET.** |
| `BOOTSTRAP.txt`, `selftest-e42cfb6/` | The self-test re-run: results.tsv, HEADER.txt, selftest-run.log, cases/ |
| `lead-results.tsv` | The lead's 42/42 results, from 0bf4798 |
| `PREFLIGHT.txt`, `preflight-e42cfb6/`, `preflight-state.txt`, `st/` | The namespace pre-flight and its scratch clone and remote (unchanged) |
| `orbit-state-before.txt`, `orbit-selftest-state.txt`, `orbit-state-after.txt`, `orbit-commits-during-selftest.txt` | orbit-board HEAD, refs, config, hooks, info, index mtime, evidence dirs and status, and the commits made by others during my runs |
| `src/`, `diff-2d.txt` | e42cfb6's `bin` (for reading) and the cccb714→e42cfb6 diff of `bin/` |
| `e2e/` | <ul><li>Harness: `build-harness.sh`, `build-clone.sh`, `launch.sh`, `check.sh`.</li><li>Runs: `run*.sh`, `run*.out`, `run*.queue.out`, `out-run*`.</li><li>Scratch `repo` and `repo-remote.git`; fake `clone`, `clone-cf` (check fails) and `clone-slow` (1.6 s jsdom lookup).</li><li>`run27-inner.sh` (PID-namespace decoy), `LAUNCHES.txt` (33 launches).</li></ul> |

## Rules kept

**orbit-board.** Nothing was edited, staged, committed or pushed in /home/user/orbit-board, /home/user/orbit-ui or any worktree. No refs,
config, grafts or hooks were made there.
- **My commands there:** `show`, `archive`, `log`, `diff`, `ls-files`, `rev-parse`, `for-each-ref`, `ls-remote` (GitHub, read-only), and a
  `clone --no-hardlinks` as source, plus `status` with `GIT_OPTIONAL_LOCKS=0`.
- **Two exceptions, both from the runner and both read-only in content.** The self-test re-run (requested) ran A22's `git status` and A15's
  `clone --shared` against orbit-board.

**Scratch only.** Every git-state attack, backup and push used `$W/e2e` and `$W/st`.

**Not run.** mutate.mjs was never imported or executed (the fake catalog is text). No audit-import, Playwright, verify:grid, layout-fits or
product suite ran; all suites were fakes.

**Bounds and cleanup.**
- Every command was bounded.
- I killed only my own recorded PIDs and groups, and decoys inside my own PID namespace.
- `chattr -i` was used only on my snapshots. **0 immutable entries remain under `$W`** (4:59 PM ET).
- The scratch lock left by run5 ("someone else's run") was removed.
