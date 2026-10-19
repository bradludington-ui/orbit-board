# VERDICT: ORBIT runner correction 40f7979 (independent adversarial review)

Reviewed: `40f7979aa2db1464218b9ec5785f8a1511c15916` on claude/v200-fixes-wip, recovery/v200/bin only, and the self-test
evidence in `recovery/v200/evidence/runner-40f7979/selftest/` (evidence commit 592d629, 10:09:06 AM ET).
Review work: 10:09 to 10:29 AM ET, 12 Oct 2026 (Eastern, from the clock). Written from 10:29 AM ET.
`$W` below = `/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L5/review-runner`.

## Bottom line

**Not approved as committed. Two must-fix defects; both are one-token fixes.** No defect found here is triggered in the
environment the queue will actually run in. I checked that environment: no `BASH_ENV`, no exported functions, `SHELLOPTS`
not exported, benign `GIT_CONFIG_*`, no replace refs in orbit-board, and no `re.py` or `collections.py` in
/home/user/Word-Matching-. So the 10:08 AM ET self-test result stands, and my re-run reproduces it at 13/13. But two code
defects defeat a stated requirement on a path I demonstrated, and a group of trust-the-environment gaps lets the provenance
check report "every blob equal" while different code runs.

| # | Requirement (Brad, 12 Oct) | Verdict |
|---|---|---|
| 1 | Pin a full backup SHA; run all helpers from a verified, frozen, task-local snapshot | **MET** in a clean environment. Hardening should-fixes S1, S2, S4. |
| 2 | Verify provenance before executing any helper, mkmanifest included; alone-run derives helper paths from its own snapshot | **NOT MET, narrowly.** One interpreter call loads modules from outside the snapshot (M1). Every helper *file* is checked first, mkmanifest included, and alone-run is self-derived. |
| 3 | Recorded exit 0, the suite's completion verdict, and no timeout or interruption before sensitivity | **NOT MET, narrowly.** run.sh can record an exit 0 that is not the suite's (M2). Every case Brad named is refused under the normal launch. |
| 4 | Bounded refusal checks: an altered helper; a banner followed by a nonzero exit or a timeout | **MET.** Present, bounded, and reproduced 13/13. Coverage gaps are in S8. |

## MUST-FIX

**M1. sens-import.sh line 35 runs `python3 -c` without `-I`, so it imports `re` and `collections` from the launch
directory.** This is code from outside the snapshot, with no provenance check, run during every audit-import sensitivity
mutation. Every other python call in the runner uses `-I`; this one was missed.
- Repro: `$W/extra/probe/shadow/` holds `re.py` and `collections.py`, each of which writes a marker. With that as the cwd I
  ran the exact text of sens-import.sh lines 35-36. Both markers were written (`SHADOW-re-RAN`, `SHADOW-collections-RAN`),
  and the one-liner then crashed (`module 'collections' has no attribute 'Counter'`).
- The cwd is inherited: final-tree-v4, alone-run and sens-import never `cd` in their main shell, so it is the operator's
  launch directory. The 10:08 self-test was launched from /home/user/Word-Matching- (see `# cwd:` in its fake logs).
- run.sh line 13 (`python3 -c "import time…"`) is not exploitable today because `time` is built in (`SHADOW-time-RAN`
  absent). Add `-I` there too.
- **Fix:** `python3 -I -c` in both places.

**M2. run.sh starts the suite with `setsid` without `-w`, then records `wait $P` as the suite's exit.** When the background
child leads its own process group, util-linux `setsid` forks and its parent exits 0 at once. run.sh then writes
`# end:` and `# exit: 0` immediately. The suite keeps running, prints its banner after the trailer, and exits 1 unrecorded;
gate.sh ACCEPTs at sensitivity time. This is exactly "a success banner followed by a nonzero exit". The PID run.sh records
is also the dead setsid parent, so killing by the recorded group no longer reaches the suite.
- Repro E12, in `$W/extra/env/`: `env SHELLOPTS=braceexpand:hashall:interactive-comments:monitor $SB/run.sh e12.log 20 --
  banner-late-exit1.sh` (sleep 1; echo banner; sleep 1; exit 1).
  - run.sh returned at once: `exit=0 dur=0.1s`.
  - The gate right then said `REFUSE … no completion verdict`. Four seconds later it said **`ACCEPT e12.log`**.
  - e12.log ends `# exit: 0  duration_s: 0.1` then `ALL CHECKS PASSED`.
  - Control, the same fake without SHELLOPTS: `REFUSE e12-control.log: recorded exit 1`.
- The trigger is environmental (an exported SHELLOPTS with `monitor`, or a BASH_ENV that runs `set -m`). The defect is in
  run.sh's own exit recording, which is the mechanism Req 3 rests on. `setsid -w` exists for exactly this.
- **Fix:** `setsid -w env … timeout …`.

After M1 and M2, re-commit, re-freeze, and re-run the self-test with the extra cases in S8.

## SHOULD-FIX (priority order)

**S1. Provenance trusts the environment and repo-local git state; recommended as a single change.** Each item below was
demonstrated against the real, unmodified final-tree-v4.sh, gate.sh or sens.sh. Each run stopped only at the deliberately
missing clone.

- **R3: git filters.** `vh` and the snapshot loop call `git hash-object` without `--no-filters`. A clean filter passed
  through the `GIT_CONFIG_*` env channel, which this platform already uses for three keys, made an always-ACCEPT gate.sh
  (blob 9d5bc5d…) hash as the pinned a18f2a0….
  - final-tree-v4 wrote `snapshot … verified …: 24 files, every blob equal, immutable`.
  - That gate.sh answers `ACCEPT banner-exit1.log` on the self-test's banner-then-exit-1 log.
  - Control, the same snapshot without the filter: refused (`12c12 < a18f2a…  gate.sh`).
  - core.autocrlf, set globally or in the cwd's repo, likewise makes CRLF variants hash as the LF blob. See
    `$W/extra/probe/hash`.
- **R4: replace refs and GIT_DIR.** `git rev-parse`, `ls-tree` and `merge-base` honour `refs/replace/*` and an inherited
  `GIT_DIR`. In a scratch clone reached through `GIT_DIR`, `git replace 40f7979 <commit with an always-ACCEPT gate.sh>`
  made the **real pinned SHA 40f7979** pass as `24 files, every blob equal, immutable` with that gate.sh in the snapshot.
  Control with the replace ref deleted: refused.
- **E13: BASH_ENV.** `BASH_ENV=accept-env.sh` (`echo "ACCEPT $(basename "$1")"; exit 0`) turns the real gate.sh's
  `REFUSE banner-exit1.log: recorded exit 1` into **`ACCEPT banner-exit1.log`**. The file is unchanged, so no blob check
  can see this.
- **E14: exported functions.** An exported function `git` answers `hash-object` with the pinned blob. The real sens.sh then
  executed an **altered mkmut.py**: marker `ALTERED-mkmut-RAN` written. Control without the function: `REFUSED: mkmut.py is
  e8b1388…`, and no marker.
- **Fix:**
  - Bootstrap with `env -i` and an explicit allowlist (PATH, HOME, TZ, LANG, RUNNER_SHA, SNAP).
  - Use `#!/bin/bash -p` on the helpers, which ignores BASH_ENV, ENV, SHELLOPTS and inherited functions, or have each
    helper refuse when any of these is set.
  - Run git as `git --no-replace-objects` with `GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null`, unset `GIT_DIR` and the
    other `GIT_*` variables, and use `hash-object --no-filters`. Or compute the blob SHA directly with `python3 -I`.

**S2. A failed fetch is swallowed, so the backup check can use a stale ref.** Line 31 runs
`git fetch … 2>/dev/null`, ignores the status, and records nothing.
- R5 in `$W/extra/git`, with a scratch bare remote:
  - Commit U `1cc9278…` was pushed, so the tracking ref moved to U.
  - The remote was then rewound to 592d629, simulating a force-push by someone else, so U is not on the remote.
  - The remote was made unreachable. final-tree-v4 with RUNNER_SHA=U printed **`snapshot … verified`** and stopped only
    at the clone.
  - Control with the remote reachable: `REFUSED: 1cc9278… is not on origin/claude/v200-fixes-wip`.
- **Answer to the brief's question:** a commit that was *never* pushed cannot pass through orbit-board's own tracking ref,
  because the refspec is `+refs/heads/*:refs/remotes/origin/*` and the ref moves only on a successful fetch or push. It
  can pass if the ref was moved locally or git is pointed elsewhere (S1). A commit *rewound off* the remote passes whenever
  the fetch fails, and nothing records that the fetch failed: R1 to R3 used `GIT_ALLOW_PROTOCOL=file`, the fetch failed,
  and the summary still said only "verified".
- **Fix:** refuse when the fetch fails, and check against FETCH_HEAD or `git ls-remote`, not the cached ref.

**S3. The gate trusts in-band markers and does not check where the verdict sits.**
- **E1b:** the suite prints the banner, `# end: …` and `# exit: 0`, and run.sh itself is then interrupted with TERM through
  its timeout wrapper, so it writes no trailer. Result: **`ACCEPT`**. The log's only end and exit lines came from the
  suite. Repro: `$W/extra/gate/e1.sh`, log `f/inject-interrupted2.log`.
- **E11:** a banner written by an orphan *after* run.sh's `# exit: 0` (the suite itself printed only "done"): **`ACCEPT`**.
- **E10:** `NOT ALL CHECKS PASSED` with exit 0: **`ACCEPT`**, because the pattern is unanchored.
- No current suite prints such lines. audit-board:4756, audit-import:7813, audit-recon:4519 and audit-ui
  (claude/v200-ui):766 each print the banner once as their last line, then `process.exit(0)`. So these are latent.
- **Fix:**
  - run.sh writes the exit status to a sidecar file (e.g. `$LOG.exit`) that the suite cannot know or write to.
  - The gate requires the trailer to be the file's last lines, and the verdict to be the last suite line before them,
    anchored as `^ALL CHECKS PASSED$`.
  - The gate also checks the `# git:` and `# cmd:` header lines.

**S4. The snapshot is not checked "file for file" or kept frozen after start.**
- **R1:** an extra file named `..x` passes, with `24 files, every blob equal`, because the glob `* .[!.]*` misses names that
  begin with `..`. Harmless today, since nothing loads it, but the claim is false. Use `find -mindepth 1 -maxdepth 1`.
- **Immutability is checked once, and only for `$B` and `$B/*`.** As root here:
  - `chattr +i` blocks append, truncate, rm, mv, touch, chmod, hard links, creating files in the dir, renaming the
    immutable dir, python `r+` and `dd`. All got EPERM.
  - But root holds CAP_LINUX_IMMUTABLE: `chattr -i` followed by a write succeeded.
  - And `<outdir>/runner` is not frozen. `mv runner runner.moved && mkdir -p runner/recovery/v200/bin && echo evil > …`
    succeeded (`$W/extra/imm`).
  - The per-call `vh` would catch *altered* content at that path. It would not catch an identical but **mutable** copy,
    which could then be edited while bash is still reading it (bash reads scripts incrementally).
- **Fix:** `chattr -R +i "$S"` (the whole snapshot root), and have `vh` re-check `lsattr` and the inode recorded at start.
- **Symlinks** are refused (R2: `gate.sh … not immutable`), but only because `lsattr` errors on symlinks. Make that an
  explicit `[ -L ]` refusal.
- Extra `.x` files, extra directories (`__pycache__`) and missing files were all correctly refused (R1c, R2b, R2c).

**S5. "Immediately before" and refusals that do not stop the queue.**
- **final-tree-v4 line 80:** backup-run.sh is checked *before* sens.sh, then executed after sens.sh's runs, which can take
  many 600 s runs.
- **A `vh` refusal inside `$(…)`** (`gate()`, `v()`, `passed()`) or inside the background L1/L2 lanes ends only that
  subshell. W2 (`$W/extra/bashenv`), with an altered gate.sh: line 59 would record
  `baseline audit-import: REFUSED: gate.sh is 73296ea…`, `passed audit-import` is false, and the script keeps running.
  This fails closed for sensitivity, but the queue does not stop.
- **alone-run.sh line 34** ignores sens-import.sh's exit status, so a refused sens-import still returns 0 and leaves
  nothing in the summary.
- **Fix:** have `vh` write a refusal marker that the top level checks, and check the exit status of every helper.

**S6. verify:grid and standards are gated with `.`** It matches the header lines. E6: a silent exit 0 gives `ACCEPT`. E7: an
`Error: …` line with exit 0 gives `ACCEPT`.
- **This does not affect sensitivity.** `passed()` gates only audit-import, audit-recon, audit-board and audit-ui.
- But the summary says "ACCEPT" for runs whose verdict was never checked.
- standards has a real verdict, `CONFORMANCE HOLDS AGAINST THE BASELINE` (tools/standards-check.mjs). Use it.
- verify:grid is an `&&` chain of npm scripts with no single verdict. Label it "exit 0, no verdict pattern".

**S7. Two false refusals (fail-closed, but they would wrongly mark a good baseline INCOMPLETE).**
- **E8:** a NUL byte in the output makes grep treat the log as binary, so the exit is read as empty: `REFUSE … recorded exit `.
  Use `grep -a`.
- **E9:** the text "TIMED OUT" anywhere in a passing log refuses it. Anchor the check to `^# TIMED OUT`.

**S8. Self-test coverage.** All 13 claims hold; I checked what each case actually exercises.
- **A1** is refused by the up-front snapshot check, not by the per-call `vh` before mkmanifest. No case reaches any of
  final-tree-v4's per-call checks, and none tests the `gate`/`passed` wiring.
- **A4** tests only sens.sh's copy of `vh`. The four copies are byte-identical (md5 e552510d…), so it is representative.
- **A2** runs against the shared live lock path, `scratchpad/AUDIT_IMPORT_RUNNING`. If that refusal ever regressed,
  alone-run would `rm -f` a live audit-import lock. Make LOCK overridable, or skip A2 while the lock exists.
- **A1, A6 and A7** run a real `git fetch` in /home/user/orbit-board.
- **Add cases:** E1b, E11, E12, E13, E14, R1, R3, R4, R5, W2, and a single unfrozen file.
- **Caution for anyone re-running G3 by hand from a job-control shell:** there, `setsid` forks, and TERM to `$!` kills only
  the waiter. My first E1 attempt did exactly this: run.sh survived and wrote a real trailer (`# exit: 143`), so it is
  discarded and replaced by E1b. The committed self-test runs as a non-interactive script and interrupts run.sh correctly.

**S9. Incomplete evidence.** `selftest/BOOTSTRAP.txt` is one line that ends `| tar -x; chattr -R +i`. It gives no target
directory, no runner-selftest.sh invocation, no outdir, and no RUNNER_SHA/SNAP/cwd. The pids.txt omits the self-test's own
PID. Record the full command lines.

## Answers to the specific questions

- **Any helper run without a blob check immediately before it, or from outside the snapshot?**
  - Statically, every `$B/…` execution in final-tree-v4, alone-run, sens-import and sens has a `vh` in front of it:
    mkmanifest (line 45, and its fallback), run, gate (`gate()`), alone-run, mcount, backup-run, sens, overlap-watch,
    sens-import, and mkmut.
  - mcread.py, loaded by importlib from `os.path.dirname(abspath(__file__))`, is checked with its caller.
  - `python3 -I` drops the script dir and cwd from `sys.path` and ignores PYTHON* variables, and no `__pycache__` can
    exist: the directory is refused and `$B` is immutable.
  - **Exceptions:** M1 (`python3 -c` without `-I`); S5 (line 80 timing); and S1, the environment paths that make the check
    itself lie.
- **Can the gate ACCEPT a failed, timed-out, interrupted or sub-step-banner run?**
  - Refused: two `# exit` lines (E2); a banner then a later crash (E3, exit 1); CRLF banner with exit 1 (E5); and G1 to G5.
  - CRLF opens no hole (E4 accepts correctly).
  - Accepted: E1b (in-band trailer plus an interrupted runner), E11 (banner after the trailer), E10 (substring), and E12
    (M2).
  - No current suite prints its banner from a sub-step.
  - `.` for verify:grid and standards matches anything, but those two do not authorize sensitivity (S6).
- **Can sensitivity start without an ACCEPT?** Not in normal operation. `passed()` re-gates every time, and any non-ACCEPT,
  including a `vh` refusal inside `gate()` (W2), means INCOMPLETE. It can start only through a wrong ACCEPT (S3, M2, S1).
  - A stale log from a reused outdir could be gated: final-tree-v4 does not refuse a non-empty outdir. But run.sh truncates
    each log at start, so a stale log survives only if run.sh never ran for that suite. Refuse a non-empty outdir anyway.
- **Snapshot extra, missing, symlink or non-immutable?** An extra `..x` passes (R1). Extra `.x`, extra directories, missing
  files, symlinks (by side effect) and unfrozen files (A7) are refused. Unfrozen parents are not checked (S4).
- **Does `chattr -R +i` block writes by root here?** Yes, for every direct write (ext4, all EPERM). It does not stop
  `chattr -i` (root has CAP_LINUX_IMMUTABLE), or a rename of the unfrozen `<outdir>/runner` (S4).
- **Unpushed commit with a failed fetch?** See S2. A rewound commit passes (R5); a never-pushed one needs a locally moved
  ref or GIT_DIR.

## Self-test re-run (as BOOTSTRAP.txt describes, in a NEW snapshot)

- **Bootstrap (10:15:30 AM ET):**
  `git -C /home/user/orbit-board archive 40f7979aa2db1464218b9ec5785f8a1511c15916 recovery/v200/bin | tar -x -C $W/snap;
  chattr -R +i $W/snap/recovery`.
  - All 24 blobs equal the commit (`$W/snap-blobs.txt`), and lsattr showed `----i` on every file.
- **Run:** `RUNNER_SHA=40f7979aa2db1464218b9ec5785f8a1511c15916 SNAP=$W/snap/recovery/v200/bin setsid -w timeout -k 10 300
  $W/snap/recovery/v200/bin/runner-selftest.sh $W/selftest-out` (PID 27976).
- **Result:** exit 0, `selftest done 10:15:47 AM ET: 0 failing case(s)`, 13/13 PASS, identical to the committed
  results.tsv. Output is in `$W/selftest-run.log` and `$W/selftest-out/`.
- **Timeline:** commit 10:08:21 AM ET; self-test 10:08:33 to 10:08:39 AM ET; evidence commit 10:09:06 AM ET. None is later
  than the clock.

## Artifacts (all under $W)

| Path | What it holds |
|---|---|
| `pids.txt` | Every PID I started, each run as `setsid -w timeout -k 10 …`. All were gone at 10:28 AM ET. |
| `BOOTSTRAP.txt`, `snap-blobs.txt`, `selftest-run.log`, `selftest-out/` | The bootstrap and the self-test re-run |
| `extra/gate/` (`results.tsv`, `e1.sh`, `f/*.sh`, `f/*.log`) | E1b to E11 |
| `extra/env/` | E12 |
| `extra/bashenv/` (`cases.sh`, `cases.log`) | E13, E14, W2 |
| `extra/snapcases/` (`cases.sh`, `cases.log`) | R1 to R3 and their controls |
| `extra/git/` (`r45.sh`, `r45.log`) | R4, R5. Scratch bare remote and clone only; no push anywhere else. |
| `extra/imm/` | The root-immutability test |
| `extra/probe/` | python shadowing (`shadow/`) and hash-object filters (`hash/`) |

## Rules kept

- Nothing edited, staged, committed or pushed in /home/user/orbit-board or /home/user/orbit-ui. orbit-board status is
  clean, with HEAD and origin both 592d629, and it has no replace refs.
- The only writes to orbit-board's `.git` came from the requested self-test (A1, A6 and A7 run a `git fetch`). My own
  final-tree runs used `GIT_ALLOW_PROTOCOL=file` or a scratch `GIT_DIR`.
- No mutate.mjs, no audit-import, audit-board or any full suite, and no playwright install. Only fake suites ran.
- Every command was bounded and every PID recorded. Kills were by recorded PID or recorded group only.
- `chattr -i` was used only on snapshots I created. 0 immutable files remain under $W.
