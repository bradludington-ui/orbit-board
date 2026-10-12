# VERDICT: ORBIT runner correction 2b, 60c984c (independent adversarial review)

- **Reviewed:** `60c984c621846fb3fd1eec002dda97815399f82b` on claude/v200-fixes-wip, `recovery/v200/bin/` only. The 2b changes
  are in 706f721; 60c984c adds only `-c advice.graftFileDeprecated=false` to `pg`, which I confirmed.
- **Measured against:** the review of 0c189f0 (`recovery/v200/evidence/runner-0c189f0/review-VERDICT.md`) and Brad's four
  requirements.
- **When:** review work ran from 3:04 to 3:31 PM ET, 12 Oct 2026 (Eastern, from the clock). Written from 3:31 PM ET.
- **Earlier work:** the partial review in `../review-runner3/` has no VERDICT. I read its harnesses, rebuilt them in my own
  directory and re-ran everything I rely on.
- `$W` below = `/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L5/review-runner3b`.

## Bottom line

**NOT APPROVED as committed. There is one must-fix, and it is a one-line change in backup-run.sh.**

All four of Brad's requirements are MET.
- 2b fixes the 0c189f0 must-fix (audit-inject's ending): all 13 gated suites are matched to their real endings.
- It closes the S1 environment bypass and grafts, and the S3, S4 and S8 findings.
- It closes S2 for everything except a suite that deliberately escapes its process group, which is documented as out of
  scope.
- I found no way for the gate to ACCEPT a run that did not finish and succeed, short of that deliberate escape.
- I found no refusal that fails to stop the queue, and no false refusal on any real ending.
- My self-test re-run, from a new frozen snapshot, is **41/41 PASS**, row for row identical to the lead's.

What blocks approval is the queue's own record, which never reaches the backup:
- **The final "final tree summary" backup is a silent no-op.** backup-run.sh never copies `summary-all.txt`, so it reports
  "nothing new".
- **That record holds the run's key decisions,** and none of them is ever committed or pushed:
  - the provenance line ("runner … on origin … snapshot … verified …", Req 1);
  - the audit-import baseline's gate decision, and the INCOMPLETE and sensitivity lines (Req 3);
  - NOT APPLICABLE, held, DONE, and every **STOPPED** line.
- **2b's claim for S6 is therefore false.** It says "a stop or a signal is recorded and backed up". In five stop paths I
  produced, the STOPPED line reached the backup in none.
- **The risk is real.** This session has hit two usage-limit stops today, and the backup exists for exactly that case.

Four should-fixes are worth doing at the same time:
- SF1: a signal stop leaves both lanes running every remaining suite.
- SF2: a refusal in the queue's main shell bypasses `stop()`.
- SF3: alone-run can leave overlap-watch.sh polling forever.
- SF4: the queue exits 0 even when its backups failed.

| # | Requirement (Brad, verbatim) | Verdict |
|---|---|---|
| 1 | "Pin a full backup commit SHA and run all helpers from a verified, frozen task-local snapshot of that commit." | **MET.** Live ls-remote, a fetch only if the tip is missing, `merge-base` with no grafts or replace refs, a whole-root freeze, a find listing and a check before every call. The S1 env bypass and grafts are closed (`extra/bypass`, `extra/graft`). Hardening gap SF6: a repo-local `url.*.insteadOf` still redirects `origin`. |
| 2 | "Verify provenance before executing any helper, including mkmanifest. Make alone-run derive helper paths from its own snapshot directory." | **MET.** Every helper execution in final-tree-v5, alone-run, sens-import and sens has a `vh` immediately before it: mkmanifest (v5:114), gate, verdicts.tsv, run.sh, backup-run (also in `stop()`), alone-run, mcount, sens.sh, overlap-watch, sens-import, mkmut and mcread. alone-run takes `B` from `$0`, and `vh` requires `B = SNAP`. |
| 3 | "Require recorded exit 0, the suite's successful completion verdict, and no timeout/interruption before authorizing sensitivity runs." | **MET.** `passed()` re-gates every baseline through `gv` (its verdicts.tsv row) at sensitivity time. All 13 rows match the real endings (Q3). Same-group orphans are now killed before the record (forge-orphan REFUSE). Residual: a suite that deliberately leaves its group (`setsid` or `setpgid`) can still forge an ACCEPT. That is documented as out of scope in gate.sh and run.sh. |
| 4 | "Add bounded refusal checks for an altered helper and for a success banner followed by a nonzero exit or timeout." | **MET.** Self-test A1-A3 (altered helper) and G1, G2, G10 (banner then exit 1, timeout, late exit 1). They are bounded, and 41/41 on my re-run. |

## MUST-FIX

**MF1. The queue's own summary, and every STOPPED record, never reach the backup.**
- **The cause.** backup-run.sh line 78 copies only
  `summary.txt OVERLAP.txt REFUSALS.txt` (plus `*.log` that have a `.exit`, and the mutant files).
- **Where it bites.** final-tree-v5 relies on that in two places:
  - line 165: `cp "$O/summary.txt" "$O/suites/summary-all.txt"; bk "$O/suites" "$D/suites" "final tree summary"`;
  - `stop()` (line 102), which does the same `cp`, then a best-effort backup of `$O/suites`.
- **Effect.** `summary-all.txt` is never copied into the destination, so it is never committed. `runner-blobs.txt`,
  `blobs.txt` and `manifest.tsv` are not backed up either. The defect dates back to v4 (40f7979), but 2b newly claims to
  have fixed it (S6).

Reproductions (scratch REPO, real 60c984c code with only REPO changed; summary in `$W/e2e/D1-backup-check.txt`):
- **e2e run 1, the happy path.** The queue reached DONE and exited 0. Its last backup printed **`nothing new`**. None of
  these top-level lines is in any backed-up file:
  - "runner … snapshot … verified";
  - "baseline audit-import: ACCEPT";
  - "sensitivity new audit-recon …";
  - "NOT APPLICABLE at this tree …";
  - "held, not run …";
  - "DONE …".
  All of them are in the local `out-run1/suites/summary-all.txt`.
- **Stop paths: the STOPPED line is in no backed-up file in any of them.**

  | Run | How it stopped | STOPPED lines (local) | Backed up |
  |---|---|---|---|
  | run 3 | verdicts.tsv altered: a refusal in a lane | 1 | REFUSALS.txt and suites/summary.txt |
  | run 5 | never quiet: alone-run exit 5 | 1 | only suites/summary.txt (`check \| ACCEPT`). It reads as a run that simply ended after `check`. |
  | run 7 | sens-import altered: an alone-run refusal | 1 | REFUSALS.txt and suites/summary.txt |
  | run 8 | three TERMs | 2 | — |
  | run 4 | main-shell refusal: no STOPPED line at all (SF2) | 0 | — |

**Minimal fix:**
- In backup-run.sh line 78, add the queue's own records:
  `for f in summary.txt summary-all.txt OVERLAP.txt REFUSALS.txt runner-blobs.txt blobs.txt manifest.tsv; do …`
- `applicability.json` is caught by orbit-board's `*.json` ignore rule (see SF9). Rename it, or add it with `git add -f`.
- Add a self-test or e2e case that asserts the final backup commits `summary-all.txt` with its DONE or STOPPED line.
- Then re-commit, re-freeze and re-run the self-test.

## SHOULD-FIX (priority order)

**SF1. A signal stop does not stop the lanes.**
- **What happens.** The TERM, INT and HUP trap runs `stop()` and the main shell exits. The two background lane subshells
  then carry on, because their loop breaks only on a non-empty REFUSALS file and a signal writes none. Each lane runs
  **every remaining suite**.
- **Reproduction.** e2e run 2 (`$W/e2e/run2.out`):
  - TERM went to the queue's PID at 3:18:54 PM ET. The queue was gone 1 s later, `STOPPED … the queue received a
    signal`, exit 3.
  - **45 s later, 8 more suites had run and recorded `.exit` files**, and suites/summary.txt had 10 ACCEPT lines, all
    written after the stop.
  - Run 8 shows the same.
- **Real cost.** Up to 4 × 600 s of full suites per lane, after the queue reports STOPPED. A relaunch would then find
  them as foreign processes and wait (or stop) in `quiet()`.
- **Why it is realistic.** RUNNING-CHECKS.md (line 41) records stopping a queue "by its recorded PID".
- **Fix.**
  - Keep `L1P=$!` and `L2P=$!`. In `stop()`, `kill $L1P $L2P`, then end the groups that run.sh recorded in
    `$O/pids.txt` after the start time.
  - Or have the lanes also break on a `$O/STOP` file that `stop()` creates.

**SF2. A refusal in final-tree-v5's main shell bypasses `stop()`.**
- **Where.** `refuse()` exits at once from these main-shell calls: lines 113 and 117, and the `vh` calls at 114, 132,
  144, 155 and 158.
- **Effect.** The queue does stop (exit 2, recorded in `$O/REFUSALS.txt`). But there is no STOPPED line, REFUSALS.txt is
  not copied into `suites/`, and there is no stop backup.
- **Reproduction.** e2e run 4: sens.sh was altered during the lanes, and the `vh` at line 158 refused. The summary ends
  `sensitivity new audit-recon (1) start …` with no STOPPED line. REFUSALS is in no backed-up file.
- **Fix.** After line 106, redefine `refuse` in final-tree-v5 so that, in the main shell only, it calls `stop`:
  `refuse(){ echo "REFUSED: $1"; echo "$(date -u +%FT%TZ) final-tree-v5.sh: $1" >> "$RUNNER_REFUSALS"; [ "$BASHPID" = $$ ] && stop "a helper was refused: $1"; exit 2; }`

**SF3. alone-run leaves overlap-watch.sh running forever after a refusal.**
- **Where.** alone-run line 55 starts the watcher, then line 56 runs `vh "$B/sens-import.sh"`. If that `vh` refuses,
  alone-run exits 2, and the EXIT trap clears only the lock.
- **Effect.** The watcher loops on `while [ ! -e "$O/RUNNING" ]; do sleep 1; done` with no bound.
- **Reproduction.** e2e run 7 (`$W/e2e/run7.out`):
  - sens-import.sh was altered while `quiet()` waited.
  - The queue STOPPED at 3:22:06 PM ET.
  - **`overlap-watch.sh` (PID 18277) was still polling 30 s later.** I ended it by its recorded group 17696.
- **Fix.** Either one of these:
  - check `vh "$B/sens-import.sh"` before starting the watcher;
  - add `kill $W 2>/dev/null` to alone-run's EXIT trap.

**SF4. The queue exits 0 with DONE when its backups failed.**
- **Where.** `bk()` appends "backup FAILED" to the local summary only. The final `bk` is the script's last command, and it
  ends with that `echo`, so the queue's exit is 0.
- **Effect.** A run whose every backup failed looks clean to its launcher.
- **Fix.** `BKF=1` in `bk()` on failure, and finish with `exit ${BKF:+6}`.

**SF5. `stop()` backs up only `$O/suites`.**
- **Effect.** It never backs up the sens directory in progress: line 158 stops before line 159's `bk`, so the completed
  mutation logs stay local. It never backs up the import summary either, for example alone-run's "never 30 quiet
  seconds" (run 5).
- **Fix.** With MF1, back up `$O/import` and the current sens directory too, each best-effort.

**SF6. A repo-local `url.<x>.insteadOf` (or a changed `remote.origin.url`) still makes an unpushed commit pass the backup
check.** This is the same threat class as grafts and replace refs, which 2b does neutralize.
- **Why it works.** `pg` drops system and global config, but `ls-remote origin` and `fetch origin` still read the repo's
  own `.git/config`.
- **Reproduction** (scratch REPO only, `$W/extra/insteadof/results.txt`):
  - Commit U `9fcc27b…` has an always-ACCEPT gate.sh and is on no remote branch. I pushed it to a scratch `fake.git`.
  - With that redirect in the scratch repo's local config, the real final-tree-v5 wrote **`runner 9fcc27b… (on origin's
    claude/v200-fixes-wip, now 9fcc27b…) snapshot … verified`**.
  - That snapshot's gate.sh answers `ACCEPT check.log` for any regex.
  - Control, with the config removed: `REFUSED: 9fcc27b… is not on origin's …`.
- **This needs a write to orbit-board's config.** I checked: orbit-board's local config is unchanged.
- **Fix.** Pin the URL in the runner, and read it from outside any repository:
  `GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null git -C / ls-remote "$URL" refs/heads/claude/v200-fixes-wip`. Fetch by
  URL too.

**SF7. backup-run's post-commit path check reads HEAD, not the commit it just made.**
- **Reproduction** (B6 in `$W/unit/backup/results.txt`, scratch repo):
  - A post-commit hook simulated someone committing right after backup-run.
  - Result: `BACKUP FAILED: commit 4322c74 holds paths outside … -- not pushed` (exit 3).
  - Yet backup-run's own commit `a3b80d8` held only its destination.
- **Effect.** It is benign (recorded, and the next backup pushes it), but the check does not check what it says it does.
- **Fix.** Either:
  - build the commit with a private `GIT_INDEX_FILE`, `commit-tree` and `update-ref <ref> <new> <old>`, then check that
    commit;
  - or record `C=$(git rev-parse HEAD)` straight after the commit and check `C`.

**SF8. alone-run still `rm -f`s the shared lock before every attempt, whoever set it.** This is the remainder of S10.
- **Reproduction.** e2e run 5: "someone else's run" in `AUDIT_IMPORT_RUNNING` was **REMOVED** as soon as alone-run
  started waiting.
- **Fix.** Remove the lock only when `HAVE_LOCK=1`. Wait while a lock it did not set exists.

**SF9. Mutant `.json` files are silently never committed.** orbit-board's `.gitignore` has `*.json`. backup-run copies
`mut-<id>.json` into `<dest>/mutants/`, and `git add -- "$D"` silently skips ignored files.
- **Confirmed in orbit-board itself:**
  - 15 `mutants/*.diff` are tracked;
  - 0 `mutants/*.json` are tracked;
  - the `.json` files sit in the working tree as ignored (`git status --ignored`, read with `GIT_OPTIONAL_LOCKS=0`).
- **This predates 2b.** The `.diff` and the summary blob carry most of the same information.
- **Fix.** `git add -f -- "$D/mutants"`, or write the files as `.json.txt`.

**SF10. Lower-priority items:**
- **`# cmd:` is still not checked by the gate** (the remainder of S7). The queue builds the command from the same `$s`, so
  this is latent.
- **Preamble refusals are not recorded.** The refusals for "must run as its own program" and "did not clean" exit 2
  without `refuse()`, so RUNNER_REFUSALS never gets them.
  - From gate.sh, the run is marked INCOMPLETE instead of stopping the queue.
  - From backup-run, it is recorded as "backup FAILED".
  - It cannot happen when the queue starts them, since the first pass cleans the environment.
- **When `gv` refuses, the lane's summary line shows an empty verdict.** Run 3 shows `audit-recon | # exit: 0 … | ` with
  nothing after the bar. It is not ACCEPT, so this is cosmetic.
- **quiet()'s message prints the wrong time.** It says "never 30 quiet seconds within an hour (from $(et))", which is the
  stop time, not the start.
- **Self-test coverage still has three gaps** (the remainder of S5):
  - A1 is refused by `snapcheck`, not by the per-call `vh`;
  - A12 covers a failed ls-remote, not a failed fetch;
  - no case runs the queue past the clone check. The header says so; my e2e runs 1-8 cover that part.

## Answers to the questions

### Q2. New defects in 2b, item by item

- **Second-pass environment allowlist** (`$W/unit/env/results.txt`; raw `execve` with a preset marker):
  - **Refused, with the name given:** GIT_DIR, LD_PRELOAD, BASH_ENV, `A-B`, `BASH_FUNC_git%%`, a newline in a name
    (`PWD\nGIT_DIR`), lowercase `https_proxy`, GCONV_PATH and TZ.
  - **Harmless:**
    - an entry with no `=`, and an empty name: bash drops both;
    - duplicate allowlisted names;
    - SNAP, SHLVL, `_`, OLDPWD.
  - **No false refusal:**
    - gate.sh launched from this 152-variable shell works;
    - all 41 self-test cases, and all 8 e2e queue runs, pass through every helper.
  - **No bypass found.** It runs after `exec`, so a preloaded library has already run by then. That is inherent, and
    `LD_PRELOAD` is still named.
  - The 0c189f0 attack (a preset marker, `GIT_ALTERNATE_OBJECT_DIRECTORIES` and an `insteadOf` pointing at a fake origin
    holding an unpushed always-ACCEPT commit) is now **REFUSED before anything runs**: `$W/extra/bypass/attack*.out`.
  - The allowlist does not check values; RUNNER_NET_PROXY is passed through as designed.
- **run.sh's `kill -KILL -- -$P`:**
  - **What `$P` is.** With `set +m` the background child is not a group leader, so `setsid` calls `setsid()` without
    forking. `$P` is then the session and group leader of setsid, env and timeout (one PID), and timeout's own
    `setpgid(0,0)` changes nothing.
  - **It reaches only that group.** Verified with `$W/unit/kill/results.txt`:
    - a sibling in the caller's group survived;
    - a child the suite started in its own session survived (as Playwright's browsers do).
  - **PID reuse is no practical risk.** It would need the group to empty and `pid_max` (32768) to wrap within
    microseconds.
  - **It breaks no real suite.** Real `npm run check`, legacy-fsrc and boot-same, run through run.sh in a scratch clone at
    37f7ee3, all **ACCEPT** on their verdicts.tsv rows (`$W/real/results.txt`).
  - **Forging tests:**
    - forge-orphan (same group): **REFUSE recorded exit 1**, so it is fixed;
    - `setsid` escape and `setpgid` escape: **ACCEPT**. These are deliberate escapes, documented as out of scope.
- **verdicts.tsv:**
  - **The table.** It has 14 rows, each with exactly 3 tab-separated fields. The empty third column passes as
    `${b:+"$b"}`. The comment lines contain no tabs.
  - **`vd`.** It uses `$1==s`, so `audit` never matches `audit-ui`. It refuses on zero or two rows.
  - **Refusals propagate out of `$( )`.** In e2e run 3, verdicts.tsv was altered during the lanes:
    - `vh` refused inside `$(vd)` inside `$(gv)` in both lanes, and wrote to REFUSALS;
    - both lanes stopped before their next suite (**0 suites started after the alteration**);
    - the main `chk` stopped the queue with exit 2.
- **backup-run** (`$W/unit/backup/results.txt`):
  - B1: someone else's staged product file was **not** swept in (`--only`), and stayed staged;
  - B2: a busy index gives exit 3 "BACKUP FAILED: git add";
  - B3: another branch gives exit 3;
  - B4: `../x` gives exit 2, a refusal recorded in RUNNER_REFUSALS;
  - B7: an unreachable remote gives exit 3 after 4 tries (31 s);
  - the exit codes are as documented;
  - the post-commit check reads HEAD (SF7), and `*.json` is ignored in orbit-board (SF9).
- **`stop()` and the trap:**
  - **No unbounded recursion.** Run 8 sent three TERMs, two during the stop backup (with a 6 s push delay). The handler
    ran twice: 2 STOPPED lines, exit 3.
  - **Subshells and lanes do not inherit the trap**, so there is no double stop.
  - **The best-effort backup runs**, but carries no STOPPED record (MF1). Signal stops leave the lanes running (SF1).
  - **Small window.** Under `timeout -k`, a stop backup that takes longer than the kill grace is SIGKILLed. That is low
    risk, since `git add` and commit take under a second.
- **Early exit from a lane:** correct. Run 3 shows each lane breaks at its next suite after a refusal.
- **Bounded `quiet()`:** correct.
  - In run 5 the bound was 4 s: alone-run exited 5, and the queue gave `STOPPED … (alone-run exit 5 …)` with exit 4.
  - It is per attempt and checked every second. The message time is cosmetic (SF10).
  - The shared-lock removal remains (SF8).
- **gate.sh's trailing-whitespace strip** (`$W/unit/gate/results.txt`, 25 cases, all as expected):
  - **legacy-fsrc's two leading spaces are kept.** It ACCEPTs with trailing spaces and CR, and REFUSEs with 0, 1 or 3
    leading spaces or a leading tab.
  - **audit-inject:**
    - ACCEPT on its real ending, including with trailing spaces or CR;
    - REFUSE on a 95-character rule, a banner without the rule, the rule without the banner, the failure path, and more
      output after the rule.
  - **Also correct:**
    - standards with CRLF: ACCEPT;
    - a lone CR, form feed or vertical tab after the banner: ACCEPT;
    - an ANSI reset or a non-breaking space after the banner: REFUSE;
    - `0 FAILING CHECK(S)` anywhere: REFUSE.
  - The strip happens after `tr -d '\000'`, and the anchors are whole-line, so no false ACCEPT comes from it.

### Q3. Each gated suite against its real ending

All 13 match. I read each ending at HEAD, and audit-ui from `claude/v200-ui` (5a298b7) as instructed. The other 12
endings are byte-identical in their last 12 lines on both branches.

| Suite | Real success ending (source line) | verdicts.tsv row | Match |
|---|---|---|---|
| check (`npm run check --silent`) | check.mjs:635 `'\nall checks passed\n'`, exit 0 | `all checks passed` | yes (also live: ACCEPT) |
| audit-import | audit-import.mjs:7813 rule, then `ALL CHECKS PASSED`, exit 0 | `ALL CHECKS PASSED` | yes |
| audit-board | :4756 | `ALL CHECKS PASSED` | yes |
| audit-hostile | :227 | `ALL CHECKS PASSED` | yes |
| audit-ppt | :294 | `ALL CHECKS PASSED` | yes |
| legacy-fsrc | :20 `'\n  every legacy Force setting computes exactly as before\n'` | two leading spaces kept | yes (also live: ACCEPT) |
| boot-same | :44 `every page, source, save and error list is identical either way` | same | yes (also live: ACCEPT) |
| audit-recon | :4519 | `ALL CHECKS PASSED` | yes |
| audit-inject | :659-669 `ALL CHECKS PASSED`, then `'='.repeat(96)`, then a blank line | `={96}`, with `ALL CHECKS PASSED` on the line before | yes |
| audit-other | :1510 | `ALL CHECKS PASSED` | yes |
| audit | :1234 | `ALL CHECKS PASSED` | yes |
| audit-ui (v200-ui 5a298b7) | :1089-1090 rule, then `ALL CHECKS PASSED`, exit 0 (all blocks are `await`ed) | `ALL CHECKS PASSED` | yes |
| standards | standards-check.mjs:436-438 `CONFORMANCE HOLDS … — N known finding(s), M instance(s), nothing new`, then `These are DEBT, …` | the line before and the last line, as in source | yes |

Other checks on these endings:
- **No passing path prints `N FAILING CHECK`, `# end:`, `# exit:` or `# TIMED OUT`.** Every `FAILING CHECK` print is on a
  failure path.
- **verify:grid is `--exit-only`** (ACCEPT-EXIT-ONLY), and `passed()` does not use it.
- **G18 replays real logs with `^# ` lines stripped.** None of those logs has a suite line starting `# `, so the replay is
  faithful.

### Q4. Can the gate accept a bad run? Can a refusal fail to stop the queue? Is there a false refusal?

- **Can the gate ACCEPT a run that did not finish and succeed?** Not without deliberate subversion.
  - Refused: exit 1, timeout (124/137), an external TERM (143, which timeout re-raises), and an interruption with no
    `.exit`.
  - Refused: a same-group orphan rewrite, a late write, look-alike trailers, a failing-check line, a banner followed by
    more output, the wrong commit, and NOT ALL.
  - Self-test G1-G18 plus my gate, kill and env cases.
  - **Two deliberate paths remain:**
    - a suite that leaves its group (`setsid`, `setpgid`) and forges the log and `.exit`. Documented out of scope.
    - SF6: a repo-local `insteadOf` that makes an unpushed always-ACCEPT snapshot "verified". This needs a write to
      orbit-board's config.
- **Can a refusal fail to stop the queue?** No. Every refusal I produced ended the queue:
  - inside `$(gv)` and `$(vd)`, and in the lanes (run 3);
  - in the main shell (run 4, without a STOPPED line: SF2);
  - in alone-run (run 7), from the quiet bound (run 5), and from backup-run's bad destination (exit 2, recorded).
  - A signal stop does not stop the lanes (SF1). That is a stop that does not stop, not an unstopped refusal.
- **Is there a false refusal that would mark a good baseline INCOMPLETE?** None found:
  - all 13 real endings ACCEPT (G18, my unit cases, and 3 live real suites);
  - the env check passes for every helper as the queue starts it;
  - `# git:` comes from the same clone.
  - Transient conditions STOP the queue rather than marking a baseline INCOMPLETE. One example is a `pg rev-parse`
    failing during a `git gc` in orbit-board.

## The 0c189f0 findings

| Finding | Status | Evidence |
|---|---|---|
| **M1** gate falsely REFUSEs audit-inject | **Fixed** | verdicts.tsv `={96}` + `ALL CHECKS PASSED`; G18 13/13 and G18b; my i1-i7; e2e run 1 `audit-inject … ACCEPT` on the real ending |
| **S1** env-guard bypass; grafts; `python3 -S` | **Fixed** | The second-pass allowlist refuses the original attack (`extra/bypass`) and every probe (`unit/env`). `GIT_GRAFT_FILE=/dev/null`: the graft trick works with plain git but the queue refuses (`extra/graft`). `blob()` uses `-I -S`. (New, related: SF6.) |
| **S2** forgeable `.exit` | **Partly fixed** | A same-group orphan is killed (REFUSE). Escape by `setsid` or `setpgid`: ACCEPT, now documented out of scope, and the header claim is corrected. No queue-held record. |
| **S3** FIRSTFAIL and RUNNER_LOCK leak | **Fixed** | e2e run 6: "launched with FIRSTFAIL=1 RUNNER_LOCK=…; cleared". The sensitivity cmd has no `MUT_FIRST_FAIL`. The scratch lock was never used. The proxy is recorded. A21. |
| **S4** backup sweep, busy index, branch refusal | **Fixed** | B1-B4 and B7. New, low: SF7 (HEAD check), SF9 (`*.json` ignored, older). |
| **S5** self-test coverage | **Partly fixed** | G18 (real endings) added; G10 relabelled; A20 and A21 added. A1 still goes through snapcheck; A12 still covers only ls-remote; no queue e2e case. |
| **S6** late stop; stop not backed up; TERM unrecorded | **Partly fixed** | Lanes break at their next suite (run 3); TERM is recorded locally. But the STOPPED record is never backed up (**MF1**), a signal stop leaves the lanes running (SF1), and main-shell refusals bypass `stop()` (SF2). |
| **S7** gate strictness, `# cmd:` | **Partly fixed** | Trailing spaces and CR are fixed. ANSI after the banner is still refused, which is acceptable since no suite emits it. `# cmd:` is unchecked. |
| **S8** snapcheck outdir names | **Fixed** | Outdirs `n3 with space`, `n4%p%d` and `n6 *glob? [x]` were all verified, and each stopped only at the clone (`extra/snapnames`). |
| **S9** Playwright outside the recorded group | **Fixed (documented)** | run.sh header. Own-session children are not reached (`unit/kill`). |
| **S10** unbounded `quiet()`; shared lock removed | **Partly fixed** | Bounded at 1 h, exit 5 (run 5). The lock is still removed whoever set it (SF8). |

## Self-test re-run

- **Bootstrap, 3:10:13 PM ET.** It is the lead's command with my directory, recorded in `$W/BOOTSTRAP.txt`:
  `mkdir $W/selftest-60c984c{,/runner}`, then `git -C /home/user/orbit-board archive 60c984c… recovery/v200/bin | tar -x -C
  …/runner && chattr -R +i …/runner`, then from cwd /home/user/Word-Matching-: `setsid -w timeout -k 10 900
  …/runner-selftest.sh 60c984c… $W/selftest-60c984c`.
- **Wrapper and PIDs.** The run went through `$W/bx.sh` (recorded group 12925); the self-test's own PID was 12931.
- **Snapshot.** All 26 blobs equal the commit (`$W/snap-blobs.txt`).
- **Result.** Exit 0, `selftest done 03:11:12 PM ET: 0 failing case(s) of 41`. **41/41 PASS**, row for row identical to
  the lead's results.tsv (`diff` empty against `$W/lead-results.tsv`).

## Artifacts (all under $W)

| Path | What it holds |
|---|---|
| `VERDICT.md` | This file |
| `pids.txt` | Every group I started via `bx.sh`, plus the e2e foreign sleeps and unit siblings. The run.sh PIDs are in `unit/pids-run.txt`, `real/pids-run.txt`, `e2e/out-run*/pids.txt` and `selftest-60c984c/pids.txt`. **None alive at 3:30 PM ET.** |
| `BOOTSTRAP.txt`, `bx.sh`, `snap-blobs.txt`, `lead-results.tsv`, `selftest-60c984c/` | The self-test re-run: results.tsv, HEADER.txt, selftest-run.log, cases/ |
| `src/` | 60c984c's `recovery/v200/bin`, an unfrozen copy for reading and unit runs |
| `unit/env/` | Second-pass environment probes (`ex.py` raw execve; `results.txt`) |
| `unit/kill/` | run.sh group kill: forge-orphan, forge-setsid, forge-setpgid2, kill scope |
| `unit/gate/` | 25 gate cases on verdicts.tsv rows (legacy spaces, audit-inject, standards, CR, ANSI, NBSP …) |
| `unit/backup/` | backup-run B1-B7 against the scratch `e2e/brepo` |
| `real/` | Real `npm run check`, legacy-fsrc and boot-same via run.sh in a scratch `--shared` clone at 37f7ee3: logs and gate results |
| `e2e/` | The end-to-end harness, rebuilt from the earlier attempt and listed below |
| `extra/bypass/` | The 0c189f0 S1 attack re-run against the 60c984c preamble (refused) |
| `extra/graft/` | The graft trick, live with plain git and refused by the queue |
| `extra/insteadof/` | SF6 |
| `extra/snapnames/` | S8 |
| `orbit-state-before.txt`, `orbit-state-after.txt` | orbit-board HEAD, refs, config, info/ and FETCH_HEAD, before and after |

The `e2e/` directory holds:
- the scripts: `build-harness.sh`, `build-clone.sh`, `launch.sh`, `LAUNCHES.txt` and `run*.sh`;
- the results: `run*.out`, `run*.queue.out` and `out-run1`…`out-run8`;
- the scratch repos: `repo`, `repo-remote.git`, `brepo`, `brepo-remote.git`, and the fake `clone` with real suite
  endings;
- `D1-backup-check.txt`, the MF1 evidence.

The harness changes only these things in the runner:
- REPO;
- alone-run's SP;
- the PID lists that foreign() and overlap-watch read (control files, because the machine is shared);
- quiet()'s window (2 s) and its bound (from a control file).

The runs:

| Run | What it tested |
|---|---|
| 1 | Happy path, plus MF1 |
| 2 | TERM during the lanes (SF1) |
| 3 | verdicts.tsv altered in the lanes |
| 4 | Main-shell refusal (SF2) |
| 5 | The quiet bound and the lock (SF8) |
| 6 | FIRSTFAIL and RUNNER_LOCK |
| 7 | The overlap-watch orphan (SF3) |
| 8 | Repeated TERM |

## Rules kept, and two notes

- **orbit-board.** Nothing was edited, staged, committed or pushed in /home/user/orbit-board, /home/user/orbit-ui or any
  worktree. No refs, config, grafts or hooks were made there.
  - orbit-board's local config md5, `info/` (only `exclude`), FETCH_HEAD and replace refs (0) are unchanged.
  - **HEAD moved from 37f7ee3 to a386223 during my review.** That was the lead: Claude, 3:04:34 PM ET, "correct a
    resumption time written later than the clock (records only)". It touched only RUNNING-CHECKS.md.
- **Scratch only.** All git-state attacks, hooks, local-config redirects and backups used scratch repos, clones and bare
  remotes under `$W`.
- **Not run.** mutate.mjs was never imported or executed; I only read the fake catalog that mkmanifest.py reads as text.
  I ran no audit-import, Playwright or full product suite.
- **Real suites.** I ran only the allowed `npm run check`, legacy-fsrc and boot-same (4-15 s each), in my scratch clone.
  Its `node_modules` is a symlink to orbit-board's, used read-only.
- **Bounds and cleanup.** Every command was bounded and every group recorded. My only kills were all by recorded PID or
  recorded group:
  - TERM to my own e2e queue PIDs (runs 2 and 8, the test itself);
  - TERM to recorded group 17696 (run 7's orphaned watcher);
  - my own recorded sleeps.
- **Immutable files.** `chattr -i` was used only on snapshots I made. **0 immutable entries remain under `$W`** (checked
  at 3:30:39 PM ET).
- **Note 1.** My first command in orbit-board was a plain `git status`, at about 3:04 PM ET. It refreshed the index's stat
  cache (index mtime 19:04:27 UTC), with no content change and 7 s before the lead's commit. After that I used only
  read-only commands, with `GIT_OPTIONAL_LOCKS=0` where git might write.
- **Note 2.** The earlier attempt's directory `../review-runner3/` still holds its own snapshots. I did not touch their
  attributes.
