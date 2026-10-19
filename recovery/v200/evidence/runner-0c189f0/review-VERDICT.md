# VERDICT: ORBIT runner correction 2, 0c189f0 (independent adversarial review)

Reviewed: `0c189f02e352beded8aa7c4b56ae42b1d4068f38` on claude/v200-fixes-wip (most of the change is in its parent 80b2d0b),
recovery/v200/bin only, against the review of 40f7979 (`recovery/v200/evidence/runner-40f7979/review/VERDICT.md`).
Review work: 10:56 to 11:24 AM ET, 12 Oct 2026 (Eastern, from the clock). Written from 11:25 AM ET.
`$W` below = `/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L5/review-runner2`.

## Bottom line

**NOT APPROVED as committed. There is one must-fix: a one-line change in final-tree-v5.sh.**

The correction closes both earlier must-fixes (M1, M2). It also closes most of the should-fixes; I re-ran the original
attacks where I could and checked each fix. Every helper is checked immediately before it runs. A refusal anywhere stops
the queue, and the gate refuses every failed, timed-out, interrupted or sub-step-banner run I could produce
non-adversarially. My self-test re-run from a new frozen snapshot is 36/36 PASS and identical to the lead's.

What blocks approval is the stricter gate itself. Its new rule, "the verdict must be the suite's last line", is
contradicted by a real queue suite:
- **audit-inject prints `ALL CHECKS PASSED` and then a `====` rule line.** So the queue will record its passing baseline
  as **REFUSE**, every time.
- I reproduced this from a real passing log, and end to end through the full queue (M1 below).
- It does not authorize or block sensitivity, since audit-inject has none. But the runner exists to produce the baseline
  evidence, and as committed that evidence would certainly be wrong for one of its 13 suites.

Of the should-fixes, four are worth doing before the queue is used:
- S1: the env -i guard can be bypassed.
- S2: the `.exit` record can be forged by the suite.
- S3: FIRSTFAIL and RUNNER_LOCK leak through the allowlist.
- S4: backup-run sweeps in, and silently drops, index state.

None of these triggers in the environment as I found it. I checked: no runner variables in the launch shell snapshot, no
grafts or replace refs in orbit-board, and no current suite forges records. But S1 and S2 are exactly the
"trust the environment" and "suite cannot write the record" properties that this correction claims to provide.

| # | Requirement (Brad, 12 Oct) | Verdict |
|---|---|---|
| 1 | Pin a full backup SHA; run all helpers from a verified, frozen task-local snapshot of it | **MET** in normal operation: live ls-remote, whole-root freeze, find listing, a check before each call. Hardening gaps S1 (a deliberate env-guard bypass or a repo-local graft makes an unpushed commit pass as backed up). |
| 2 | Verify provenance before executing any helper, mkmanifest included; alone-run derives helper paths from its own snapshot | **MET.** Every `$B/...` run has a `vh` immediately before it. I showed the per-call check firing inside `$( )` (e2e run 2) and inside a lane (run 4). M1 is fixed. alone-run takes B from `$0`, and `vh` requires B = SNAP. |
| 3 | Recorded exit 0, the suite's completion verdict, no timeout/interruption before sensitivity | **MET** for every non-adversarial case: G1-G17, my edge cases, and the `passed()` wiring end to end. Caveat S2: a suite's own orphan can rewrite the record after run.sh writes it. |
| 4 | Bounded refusal checks: altered helper; banner then nonzero exit or timeout | **MET.** Present, bounded, 36/36 on my re-run. Coverage gaps are in S5: G10 does not detect the loss of `setsid -w`, and nothing exercises the queue past the clone check. |

## MUST-FIX

**M1. gate.sh falsely REFUSEs every passing audit-inject baseline.** The verdict-last rule (gate.sh lines 88-89) requires
`ALL CHECKS PASSED` to be the last non-empty line. audit-inject.mjs ends its success path with:

```
console.log(`\nALL CHECKS PASSED`);
console.log(`${line}\n`);
process.exit(0);
```

That is, a 96-character `=` rule follows the banner. I checked this in the smoke clone (592d629), in orbit-board HEAD
97ce86e, and in orbit-ui claude/v200-ui 775903f. The real passing log
`recovery/v200/evidence/L1-correction-A-9b27e80/after-inject.log` ends the same way. final-tree-v5 line 119 gates it on
`ALL CHECKS PASSED`.

Reproductions:
- **Replay.** The real passing output of `after-inject.log` was replayed through run.sh and then gate.sh:
  **`REFUSE inject-replay.log: the last line the suite printed is not the completion verdict /ALL CHECKS PASSED/`**.
  See `$W/extra/gate2/results.txt` and `f/inject-replay.*`.
- **End to end.** I ran the full queue on a fake clone whose audit-inject has the real ending (e2e run 3). The baseline
  summary says:
  `baseline: audit-inject | # exit: 0 ... | REFUSE audit-inject.log: the last line the suite printed is not the completion verdict`.
  Every other suite ACCEPTs. See `$W/e2e/out3/summary.txt`.
- **Why it was missed.** The lead's smoke ran 6 real suites but not audit-inject, and the self-test uses only fake
  endings.

**Minimal fix:** gate audit-inject on its real two-line ending. gate.sh already supports a line-before regex.
- In final-tree-v5, let a lane entry carry an optional second regex, e.g. `"audit-inject::={96}::ALL CHECKS PASSED"`.
- Have `v()` pass it through: `g=$(gate "$O/suites/$1.log" "$H" "$2" ${3:+"$3"})`.
- Add a self-test case that replays real passing outputs (from committed evidence logs) of every queue suite through
  gate.sh.
- Then re-commit, re-freeze and re-run the self-test.

## SHOULD-FIX (priority order)

**S1. The env -i guard is keyed on a marker the launcher can preset, so the whole S1 class reopens with one variable.**

The preamble skips the `env -i` re-exec when `RUNNER_ENV_CLEAN` equals `$$`. `exec env RUNNER_ENV_CLEAN=$$ ...` runs the
script under the same PID, so the dirty environment survives. bash -p still blocks BASH_ENV, SHELLOPTS and functions, but
every variable that steers git, and LD_*, gets through.

Reproduction (`$W/extra/bypass/attack.sh`, `attack.out`):
- I built an **unpushed** commit `bab9db4` whose gate.sh always ACCEPTs. It is not in orbit-board's object store.
- I launched the real final-tree-v5.sh from a frozen snapshot of it, with `RUNNER_ENV_CLEAN=$$`,
  `GIT_ALTERNATE_OBJECT_DIRECTORIES=<scratch objects>` and a `GIT_CONFIG_COUNT` `url.<scratch bare>.insteadOf` for the
  github URL.
- summary.txt says: **`runner bab9db4... (on origin's claude/v200-fixes-wip, now bab9db4...) snapshot ... verified: 25
  files, nothing else, every blob equal, every entry immutable`** and `environment fixed by the runner preamble (env -i,
  bash -p)`. Both claims are false. It stopped only at the missing clone.
- That snapshot's gate.sh answers `ACCEPT banner-exit1.log` on a recorded exit 1; the pinned gate.sh answers
  `REFUSE ... recorded exit 1`.
- Nothing was written to orbit-board: no fetch (FETCH_HEAD untouched by me), no refs, no config.

A related gap, **grafts** (`$W/extra/graft`): `--no-replace-objects` does not disable `.git/info/grafts`. In a scratch
clone, a graft that adds an unpushed commit U as a parent of the remote tip made the exact `backedup` function print the
tip, so it passed. Without the graft it refused, `U is not on origin's ...`. Adding `GIT_GRAFT_FILE=/dev/null` to `pg`
makes it refuse again (verified).

**Fix:**
- In the second pass, unset every exported variable not on the allowlist, e.g.
  `for v in $(compgen -e); do case $v in <allowlist>) ;; *) unset "$v";; esac; done`, or refuse when any is present. The
  marker then stops mattering.
- Add `GIT_GRAFT_FILE=/dev/null` to `pg`.
- Optionally use `python3 -I -S` in `blob()`. `-I` does not skip site, and
  `/usr/lib/python3/dist-packages/distutils-precedence.pth` runs `_distutils_hack` on every blob check.

**S2. The `.exit` record is in the log's own directory, at a path the suite can derive (`readlink /proc/self/fd/1` +
`.exit`), and nothing stops the suite's orphans from rewriting it after run.sh exits.** gate.sh's header says "the suite
neither knows nor writes it". That is not so.

Reproduction (`$W/extra/gate2/f/forge-orphan.*`):
- The fake suite prints `3 FAILING CHECK(S)` and exits 1, leaving an orphan behind.
- run.sh recorded `exit=1`, and the gate said `REFUSE ... recorded exit 1`.
- The orphan then rewrote the log, with the header kept and a banner plus look-alike trailer, and rewrote `.exit` with a
  matching size and blob.
- **Three seconds later the gate said `ACCEPT forge-orphan.log`.** `passed()` re-gates at sensitivity time, which is
  exactly when this would bite.
- This needs an adversarial suite; no current suite does it. The accidental variants are all refused: G3, G7, G8, my
  interrupted-run and late-write cases.

**Fix:**
- After `wait $P`, have run.sh end the recorded process group or session (`kill -KILL -- -$P`), so that no orphan
  outlives the record. G8 still refuses.
- And/or have `runs()` keep run.sh's stdout record (exit, bytes, blob) in a queue-held file, and have the gate compare
  against it.
- Correct the header claim.

**S3. The allowlist carries FIRSTFAIL and RUNNER_LOCK from the launch shell into the queue, and the queue neither unsets
nor records them.** Reproduction, e2e run 3 (`$W/e2e/out3`), launched with `env RUNNER_LOCK=... FIRSTFAIL=1`:
- The audit-import sensitivity run became `# cmd: BOARD=... MUT_FIRST_FAIL=1 node tools/export-audit/audit-import.mjs`,
  i.e. first-catch mode. That is visible only in the log header; the summary does not say it.
- alone-run used the scratch lock instead of the shared `scratchpad/AUDIT_IMPORT_RUNNING`. That shared lock is what other
  runners wait on (e.g. `uichunk2/rv2/run-suites.sh`), so they would start alongside, and the overlap rule could repeat
  the baseline up to exit 4.
- Neither variable is in the current launch shell snapshot, so this is latent.

**Fix:** right after the preamble in final-tree-v5, `unset FIRSTFAIL RUNNER_LOCK` (or refuse if either is set). Record
RUNNER_NET_PROXY in the summary.

**S4. backup-run's commit and failure handling.** Reproduced in scratch repos (`$W/e2e/repo3`, `$W/extra/backup`):
- **Index sweep.** `git commit` takes the whole index. An unrelated file staged by "someone else" went into
  `882060b recovery/v200: final tree audit-import baseline, run(s) backed up: BASELINE (no product change)` and was pushed.
  The lead commits in /home/user/orbit-board while queues run (0a77ac2 and 97ce86e appeared during my review).
- **Busy index.** With `.git/index.lock` held, `git add` failed unchecked. backup-run printed **"nothing new" and exited
  0**: the evidence was copied but not committed or pushed, and no failure was recorded. Later backups pick it up; the
  final `bk` (line 148) would silently lose the summary.
- **Branch switch or commit failure is a refusal (exit 2).** In the queue, a refusal is a STOP, so a momentary branch
  checkout or index collision in orbit-board halts a multi-hour run: `REFUSED: backup-run.sh: orbit-board is not on
  claude/v200-fixes-wip`, recorded in REFUSALS.

**Fix:**
- `git add -- "$D" || exit 3`, and `git commit ... -- "$D"`, or use a private `GIT_INDEX_FILE`.
- Map commit, branch and lock failures to exit 3 ("backup FAILED", recorded), not to a refusal.
- The push loop itself is correct: four tries, exit 3 on failure.

**S5. Self-test coverage: its claims hold, but four cases test less than their labels say.**
- **G10 "(E12, M2)" does not test `setsid -w`.** With `-w` removed (`$W/extra/mut-g10`), G10's criterion is still met
  (`exit=1 dur=2.0s`, REFUSE), because bash -p and `set +m` already prevent job control. The `-w` fix is defence in depth
  that no case can detect.
- **A1 is refused by `snapcheck`,** not by the per-call `vh` before mkmanifest.
- **A12 covers a failed ls-remote only,** not a failed fetch.
- **No case runs final-tree-v5 past the clone check.** So gate/`passed()` wiring, lanes, refusal propagation, sensitivity
  and backup are untested. My e2e runs 2-4 cover them.
- **No case uses a real suite's output.** Such a case would have caught M1.
- A1 and A6 to A15 still run a real ls-remote from /home/user/orbit-board (and a fetch, if origin's tip is not local).
- **Fix:** add a scratch-REPO e2e case like mine; add real-ending replays; relabel G10.

**S6. Refusals stop the queue late, and the stop is not backed up.**
- **Lanes keep running.** In run 4, gate.sh was altered while lane L1 ran. Both lanes then ran **every remaining suite**,
  each gate refusing (9 REFUSALS lines), before the top-level `chk` stopped the queue. In the real queue that is up to four
  more 600 s runs per lane.
- **`stop()` never calls backup-run.** The STOPPED summary and REFUSALS.txt stay local (runs 2 and 4).
- **A TERM to the queue leaves no record** (run 1).
- **Fix:** `chk` at the top of each lane iteration, and a best-effort `bk` in `stop()`.

**S7. Gate strictness produces false refusals on formats no current suite uses** (`$W/extra/gate2/results.txt`):
- A CRLF verdict line, `ALL CHECKS PASSED` with trailing spaces, and an ANSI reset after the banner are all REFUSEd.
- `# cmd:` content is still not checked; this is the remainder of S3 from the earlier review.
- Correctly handled: a log with no trailing newline (ACCEPT), an empty body (REFUSE), and look-alike `# exit:` lines
  (REFUSE).
- **Fix:** strip a trailing `\r` and whitespace before the whole-line match, and check `# cmd:` against the expected
  command.

**S8. `snapcheck`'s freeze loop uses the outdir path as a `find -printf` format string, with an unquoted word split.**
- An outdir with a space (N3) or a `%` (N4) gets a false refusal.
- The listing comparison itself is sound. Extra, missing, newline-named and trailing-space entries were all refused (N1b,
  N2, N5; `$W/extra/snapnames/cases.log`), and I found no name that hides an entry.
- **Fix:** `find ... -print0 | while IFS= read -r -d '' p`.

**S9. Recorded-PID cleanup cannot reach Playwright's browsers.**
- With `setsid -w` and no job control, the recorded PID is the suite's process group and session leader (verified:
  `recorded 13458`, `suite pgid/sid 13458 13458`).
- Playwright starts Chromium in **its own session**: observed `sid = pgid = chromium pid`, with stdout and stderr on
  sockets, not the log. So killing the recorded group or session misses it.
- No late writes to logs come from it; the smoke logs are unchanged since their records.
- Document this for manual cleanup.

**S10 (pre-existing, low).** alone-run's `quiet()` has no bound or record. In run 1 it waited 12.5 minutes on this shared
machine without one quiet 30 s window; I then ended it by its recorded group. It also `rm -f`s the shared lock before each
attempt, whoever set it.

## Earlier findings (review of 40f7979)

| Finding | Status | Evidence |
|---|---|---|
| M1 python3 without -I | **Fixed** | Every python3 call has `-I`. The earlier shadow `re.py`/`collections.py` reproduction, run against v5's sens-import one-liner, writes no marker; the `-c`-without-`-I` control does (`$W/extra/m1`). |
| M2 setsid without -w | **Fixed** | `setsid -w`; bash -p ignores SHELLOPTS; `set +m`. G10 passes. The recorded PID is the suite's group and session leader. (G10 cannot detect the loss of `-w`: S5.) |
| S1 environment and git-state trust | **Partly fixed** | R3, R4, E13 and E14 are closed (A14-A17 on my re-run). The guard is bypassable via a preset `RUNNER_ENV_CLEAN`; grafts are honoured; FIRSTFAIL and RUNNER_LOCK leak (S1, S3). |
| S2 swallowed fetch / stale ref | **Fixed** | Live ls-remote; a failed read refuses (A12); a failed fetch refuses. R5 is closed by construction. (Grafts: S1.) |
| S3 in-band markers, verdict position | **Partly fixed** | The `.exit` sidecar, trailer-last, an anchored verdict-last rule and the `# git:` check are all in (G7, G8, G9, G14). But `.exit` is forgeable by the suite (S2); `# cmd:` is not checked; and verdict-last falsely refuses audit-inject (M1). |
| S4 file-for-file / frozen | **Fixed** | find listing (A9, N1b, N2, N5); whole root `+i` (renaming the frozen root gives EPERM); explicit symlink refusal; `vh` re-checks parents. Outdir-name false refusal: S8. |
| S5 "immediately before", refusals that do not stop | **Fixed, with a delay gap** | backup-run is checked inside `bk()`. Refusals in `$( )` and lanes are recorded and stop the queue (runs 2 and 4). alone-run checks sens-import's exit. Lanes run on after a refusal (S6). |
| S6 `.` verdicts | **Fixed** | standards is gated on its real two-line verdict (G15, smoke ACCEPT); verify:grid is labelled ACCEPT-EXIT-ONLY (G16). |
| S7 NUL, TIMED OUT text | **Fixed** | G11, G12. |
| S8 self-test coverage | **Partly fixed** | E1b, E11, E12, E13, E14, R1, R3, R4, R5 (read failure), an unfrozen file, and a scratch lock were added. Still uncovered: W2 / queue wiring, per-call `vh`, `-w`, real endings (S5). |
| S9 incomplete evidence | **Fixed** | BOOT-0c189f0.txt holds the full command; HEADER.txt the invocation; pids.txt includes the self-test's own PID. |

## Answers to the specific questions

- **Can the gate ACCEPT a run that did not finish and succeed?** Not by accident. Every failed, timed-out, interrupted,
  orphan-written or look-alike case I built was refused. Two deliberate paths do it:
  - a suite whose orphan rewrites the log and its `.exit` (S2);
  - a launch with a preset `RUNNER_ENV_CLEAN` plus git env, which "verifies" an unpushed snapshot carrying an
    always-ACCEPT gate (S1).
- **Can a refusal fail to stop the queue?** No. Every refusal path I tried ended in STOPPED: top-level `$( )` (run 2),
  lanes (run 4), helpers, and backup-run (exit 2 then `chk`). The stop can come late (S6).
- **Ordering.** final-tree-v5 checks the outdir (line 82-84), then the backup (85), then the snapshot (86), then itself
  (87), before anything else runs. No helper runs without a `vh` immediately before it.
- **Could the fixed environment break the real suites?**
  - I found no evidence that it does. The lead's A/B (`smoke-v5/ab/`, read at 11:10 AM ET) gives **identical** layout-fits
    failures (exit 1, the same six "J · ... every width 761-1023 fits" checks, R019 cut) under the inherited environment
    without LANG, with LANG=C.UTF-8, and under run.sh. So the verify:grid failure is not caused by the runner environment.
  - fontconfig matches (sans-serif, serif, monospace, Arial, Helvetica, system-ui; 103 fonts) and node's Intl locale and
    number format are identical with and without the fixed variables (`$W/extra/envdiff`).
  - Commit signing (`/tmp/code-sign`, via /root/.gitconfig) works under the fixed environment: the e2e backup commits are
    signed.
  - Not exercised under the fixed environment: the real push to github, and the jsdom suites audit-import, audit-board,
    audit-hostile, audit-ppt, audit, audit-inject and audit-ui. The risk is low: same node, NODE_OPTIONS and NODE_PATH.
- **Is there a false refusal that would wrongly mark a good baseline INCOMPLETE?**
  - For the four suites that gate sensitivity (audit-import, audit-recon, audit-board, audit-ui), none found. Each ends
    with the banner followed by `process.exit(0)`.
  - **audit-inject's good baseline is certainly recorded REFUSE (M1).**
  - Indirectly, S3's RUNNER_LOCK leak (overlapped repeats, exit 4) and S4's backup refusals (a STOP) can leave sensitivity
    unrun.

## Self-test re-run

- **Bootstrap (11:02 AM ET)**, recorded in `$W/BOOTSTRAP.txt`. It is the same as BOOT-0c189f0.txt with my own directory:
  `mkdir $W/selftest-0c189f0{,/runner} && git -C /home/user/orbit-board archive 0c189f0... recovery/v200/bin | tar -x -C
  .../runner && chattr -R +i .../runner`.
  - Then, from cwd /home/user/Word-Matching-: `setsid -w timeout -k 10 900 .../runner-selftest.sh 0c189f0...
    $W/selftest-0c189f0`. This went through `$W/bx.sh`; recorded PID 31013 (timeout), self-test PID 31015.
  - All 25 blobs equal the commit (`$W/snap-blobs.txt`).
- **Result:** exit 0, `selftest done 11:02:47 AM ET: 0 failing case(s) of 36`. **36/36 PASS**, identical row for row to
  the lead's results.tsv (10:55:25 AM ET).

## Artifacts (all under $W)

| Path | What it holds |
|---|---|
| `pids.txt` | Every group I started via `bx.sh` (setsid -w timeout), and the run.sh PIDs of my gate tests. The e2e queues' run.sh PIDs are in `e2e/out*/pids.txt`; the self-test's own are in `selftest-0c189f0/pids.txt`. None alive at 11:23 AM ET. |
| `BOOTSTRAP.txt`, `snap-blobs.txt`, `selftest-0c189f0/` | The self-test re-run: results.tsv, HEADER.txt, selftest-run.log, cases/ |
| `extra/gate2/` (`results.txt`, `f/`) | M1 replay, CRLF, no-newline, empty, trailing space, zero-failing, ANSI, look-alike exit; S2 forge-orphan; S9 pgid/sid |
| `extra/bypass/` (`attack.sh`, `attack.out`, `out/summary.txt`) | S1 env-guard bypass with an unpushed always-ACCEPT commit (scratch repo and remote only) |
| `extra/graft/` (`h-backedup*.sh`) | S1 grafts: the exact `backedup` function against a scratch clone, with and without `GIT_GRAFT_FILE=/dev/null` |
| `extra/snapnames/` (`cases.sh`, `n1b.sh`, `cases.log`) | S8 and snapcheck odd names |
| `extra/mut-g10/` | S5: G10 against run.sh with `-w` removed |
| `extra/m1/` | M1 re-reproduction (shadow modules) |
| `extra/backup/` | S4: busy index and branch switch |
| `extra/envdiff/fcmatch.txt`, `extra/trap/` | Fixed-environment font check; alone-run EXIT trap status check (it does not change the exit status) |
| `e2e/` (`LAUNCHES.txt`, `repo`, `repo3`, `remote*.git`, `clone*`, `man/`, `out1-4/`, `run*.out`) | End-to-end queues on fake clones. Harness R1 changes only REPO; harness R3 also disables `quiet()` and blinds overlap-watch, because the machine is shared and busy. Run 1: real `quiet()`, never quiet, ended by me. Run 2: gate altered during step 0. Run 3: happy path (M1, S3, S4). Run 4: gate altered during the lanes (S6). |

## Rules kept, and one deviation

- Nothing was edited, staged, committed or pushed in /home/user/orbit-board, /home/user/orbit-ui or any UI worktree. No
  replace refs, grafts, config or hooks were created there.
  - orbit-board is at 97ce86e, the lead's commit, with no replace refs; `info/` holds only `exclude`.
  - The untracked `recovery/v200/evidence/runner-0c189f0/smoke-592d629/` is the lead's.
  - FETCH_HEAD was rewritten at 11:21:31 AM ET by a fetch of `main`. That was not me: no command of mine touched
    orbit-board then, and the runner only fetches claude/v200-fixes-wip.
- All git-state attacks used `git clone --shared` scratch clones and scratch bare remotes under `$W`. Pushes went only
  there.
- No mutate.mjs was imported, executed or counted; it was read as text only. No audit-import, no full suite, and no
  Playwright run. Fake suites only; my node processes were sub-second fakes and run.sh header probes.
- Every command was bounded and every group recorded. My only kill was TERM to recorded group 13899 (e2e run 1).
- `chattr -i` was used only on snapshots I created. **0 immutable entries remain under $W** (checked at 11:23 AM ET).
- **Deviation:** while re-running the earlier M1 reproduction, my first control run executed the earlier reviewer's
  shadow `re.py` from my copy. It rewrote that reviewer's marker file
  `.../L5/review-runner/extra/probe/SHADOW-re-RAN` (the same 1-byte content, new mtime 11:22:38 AM ET). I then pointed my
  copies at `$W/extra/m1` and re-ran.
