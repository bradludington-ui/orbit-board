# VERDICT: ORBIT runner correction 2c, cccb714 (independent adversarial review)

- **Reviewed:** `cccb71493911f1493e66335b9fd1a21fa1badde9` on claude/v200-fixes-wip ("runner correction 2c"), `recovery/v200/bin/` only.
- **Measured against:** the review of 60c984c (`recovery/v200/evidence/runner-60c984c/review-VERDICT.md`, MF1 and SF1-SF10) and Brad's four
  requirements.
- **When:** review work ran from 3:38 to 4:19 PM ET, 12 Oct 2026 (Eastern, from the clock). Written from 4:19 PM ET.
- `$W` below = `/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L5/review-runner4`.
- **Harness:** I rebuilt the 3b reviewer's e2e harness in `$W/e2e`. It is cccb714's `bin` with REPO **and ORIGIN** changed (2c reads origin at a
  fixed URL, so the old harness's REPO change alone would refuse). The scratch REPO carries orbit-board's real `.gitignore` (so `*.json` is
  ignored, as in orbit-board). It also has the same control files for foreign(), overlap-watch, quiet() and, new, overlap-watch's give-up
  bound (`ctl/wbound`). Nothing else in the runner changes.

## Bottom line

**NOT APPROVED as committed. Two must-fixes, both one- or two-line changes in final-tree-v5.sh.**

- **MF1 (new in 2c):** the self-test now commits and pushes "final tree STOPPED" records into orbit-board, on the real branch and on origin.
  - **It has already happened.** The lead's own 41/41 run pushed `3b8bc73` (3:37:35 PM ET) and `ff0c335` (3:38:06 PM ET). They are now on
    origin, under `recovery/v200/evidence/x/suites/`.
  - **The cause.** 2c's SF2 fix sends the clone-check refusal through `stop()`, and `stop()` now backs up. REPO is fixed to orbit-board, and
    self-test cases A6 and A21 launch the queue with destination `x`.
- **MF2 (a remainder of 60c984c MF1):** when `npm run check` fails at the pinned tree (exit 5), the queue still never backs up
  `summary-all.txt`. Its STOPPED line, the provenance line and the invocation never reach the backup.

Everything else 2c set out to fix works in the stop paths I re-ran:
- Every stop that goes through `stop()` commits and pushes `summary-all.txt` with its STOPPED line. The happy path pushes DONE.
- Lanes end on a signal; no suite starts after STOPPED.
- Main-shell refusals stop through `stop()`.
- The watcher is gone after an alone-run refusal, and someone else's lock is kept.
- The queue exits 6 when its own backups fail.
- Mutant JSON is committed as `.json.txt`.
- The repo-local insteadOf redirect (60c984c SF6) is refused.

The gate, run.sh and verdicts.tsv bodies are unchanged:
- all 13 gated suites still match their real endings;
- I found no way for the gate to ACCEPT a run that did not finish and succeed;
- no refusal fails to stop the queue;
- there is no false refusal of a good baseline.

My self-test re-run, from a new frozen snapshot, is **41/41 PASS**, row for row identical to the lead's. It ran in a private mount namespace,
for the reason in MF1.

| # | Requirement (Brad, verbatim) | Verdict |
|---|---|---|
| 1 | "Pin a full backup commit SHA and run all helpers from a verified, frozen task-local snapshot of that commit." | **MET.** <ul><li>The full-SHA pin, snapcheck, the whole-root freeze and `vh` are unchanged.</li><li>`backedup` now reads the fixed URL from `/`, with no config. The 60c984c SF6 redirect is refused (`extra/insteadof`).</li><li>A planted commit-graph did not change what `pg` reads (`extra/commitgraph`).</li></ul> |
| 2 | "Verify provenance before executing any helper, including mkmanifest. Make alone-run derive helper paths from its own snapshot directory." | **MET.** <ul><li>Every new execution has a `vh` right before it:<ul><li>`fgw` alone-run and sens.sh (v5:149, 173, 176);</li><li>`stop()`'s backup-run (`( vh … )` once before its loop);</li><li>alone-run checks overlap-watch and sens-import before the watcher, and sens-import again before running it.</li></ul></li><li>alone-run still takes `B` from `$0`.</li></ul> |
| 3 | "Require recorded exit 0, the suite's successful completion verdict, and no timeout/interruption before authorizing sensitivity runs." | **MET.** <ul><li>gate.sh, run.sh and verdicts.tsv bodies are unchanged since 60c984c; only the preamble changed.</li><li>`passed()` still re-gates each baseline.</li><li>Runs ended by a stop record exit 143 and are refused.</li><li>The run that escapes a stop (SF2) runs after STOPPED, so nothing gates it.</li></ul> |
| 4 | "Add bounded refusal checks for an altered helper and for a success banner followed by a nonzero exit or timeout." | **MET**, with the MF1 caveat. <ul><li>A1-A3, G1, G2 and G10 are present, bounded and pass (41/41).</li><li>But A6 and A21 now commit and push to the real repository.</li><li>Their `timeout 120` (no `-k`) cannot end the queue's `stop()`, which ignores TERM while it pushes.</li></ul> |

## MUST-FIX

### MF1. The self-test commits and pushes "final tree STOPPED" records into orbit-board and origin

**The mechanism.**
- `runner-selftest.sh` `q()` runs `final-tree-v5.sh <sha> /nonexistent <case-dir> x <sha> /nonexistent` for A6 (CONTROL) and A21.
- In 2c, the clone check (v5:130) comes after the `refuse` redefinition (v5:123), so its refusal calls `stop()`.
- `stop()` copies `summary-all.txt` and `REFUSALS.txt` and runs backup-run.sh for `$O/suites` → `x/suites` and `$O/import` → `x/import`.
- REPO is `/home/user/orbit-board`, so backup-run commits `recovery/v200/evidence/x/suites/*` there and pushes to origin.

**It has already happened.**
- The lead's self-test of cccb714 made `3b8bc73` (case A6, 3:37:35 PM ET) and `ff0c335` (case A21, 3:38:06 PM ET).
- Both are titled "recovery/v200: final tree STOPPED, run(s) backed up: records".
- Both are ancestors of origin's tip `9b10e2a`.
- The lead's record commit `f7cddb7` does not mention them.

**Why it must be fixed.**
- **Misleading records.** Every self-test run adds two misleading "final tree STOPPED" commits to the evidence branch, and pushes them.
- **Collisions.** It races the lead's own commits in the same repository. The lead committed cccb714 16 s before the self-test's first push.
- **A broken claim.** The self-test header says it does not do this ("it would back up to orbit-board").
- **No safe re-run.** No reviewer can re-run the self-test under a no-write rule. I had to run mine in a mount namespace.
- **Lost bound.** A6 and A21 are no longer bounded by their own 120 s. `stop()` ignores TERM, and q() uses `timeout 120` without `-k`. A
  slow push (up to 4×120 s plus retries per backup) runs on to the outer 900 s.

**Reproduction** (my self-test re-run).
- REPO was a scratch clone bind-mounted over /home/user/orbit-board in a private mount namespace (`$W/BOOTSTRAP.txt`).
- It made `4520907` (A6) and `4c3ace9` (A21) in the scratch clone, and pushed both to the scratch remote (`$W/st/remote.git`).
- Each touches only `recovery/v200/evidence/x/suites/{REFUSALS.txt,summary-all.txt}`.
- The real orbit-board was untouched: HEAD before and after my run was 9b10e2a, and no commit touches `evidence/x` after f7cddb7.

**Minimal fix.**
- In final-tree-v5.sh, back up from `stop()` only once the queue has started.
  - After v5:136 (the `start …` line), add `STARTED=1`.
  - In `stop()`, change `if ( vh "$B/backup-run.sh" ) …` to `if [ -n "${STARTED:-}" ] && ( vh "$B/backup-run.sh" ) …`.
  - A refusal before anything has run then stops as before: STOPPED and REFUSALS stay local, and the exit is 2. It no longer pushes.
- Add to A6 and A21 an assertion that `git -C $REPO rev-parse HEAD` is unchanged across the case.
- Separately, records only and the lead's call: note or remove `recovery/v200/evidence/x/` (3b8bc73, ff0c335) on the branch.

### MF2. The check-failed stop (exit 5) never backs up `summary-all.txt`

- **Where.** v5:146-147 write `STOPPED … npm run check did not pass …` into `$O/summary.txt`, then call `bk "$O/suites" …` and `exit 5`.
- **What is missing.** There is no `cp "$O/summary.txt" "$O/suites/summary-all.txt"`, which every other stop does inside `stop()`.

**Reproduction.** e2e run20 (`$W/e2e/run20.out`), on a fake clone whose check prints "2 check(s) failed" and exits 1.
- The queue exits 5 with `STOPPED 04:10:10 PM ET: npm run check did not pass …` in its local summary.
- On the scratch remote, `summary-all.txt` is **ABSENT**.
- Only `suites/summary.txt` (`check | REFUSE check.log: recorded exit 1`), the check log, `runner-blobs.txt`, `blobs.txt` and
  `manifest.tsv` are pushed.
- So the provenance line ("runner … snapshot … verified", Req 1), the invocation and the STOPPED line stay local. This is exactly
  60c984c MF1, on the first mandatory step's failure path.

**Minimal fix.** Replace v5:146-147 with
`stop "npm run check did not pass at the pinned tree ($G); nothing else runs until its failures are resolved" 5`.
Alternatively, add `cp "$O/summary.txt" "$O/suites/summary-all.txt";` before that `bk`.

## SHOULD-FIX (priority order)

**SF1. alone-run's failed backups are not counted. The queue says DONE, exits 0, and the BASELINE log never reaches the backup** (the rest of
60c984c SF4).
- **Reproduction:** e2e run13. The scratch REPO's index was busy for the 4 s of alone-run's BASELINE backup.
  - import/summary.txt says `backup FAILED … go up with the next backup`.
  - The queue went on to `DONE 03:54:17 PM ET`, exit 0, with no FAILED line in summary-all.txt.
  - The audit-import BASELINE log is **not on the remote**, and its copies sit untracked in REPO.
- **Why "go up with the next backup" is false here.** No later backup covers `import/`. It would only be true for a push failure on a
  commit that was made.
- **The same applies** to the audit-import sensitivity stages.
- **Fix:** after each `fgw … alone-run.sh …` add `grep -q 'backup FAILED' "<its outdir>/summary.txt" && BKF=1`. Or have alone-run exit
  with a distinct code when any `bk` failed.

**SF2. A run that starts just before a stop escapes it.** `endruns` reads pids.txt once, before `stop()`'s 2 s sleep.
- **Lane case:** run17a-c, 3/3. TERM went to the queue the moment run.sh created `audit-hostile.log`, before run.sh records its PID (about
  0.3 s).
  - The queue said STOPPED and was gone at +2.3 s.
  - The suite finished with **exit 0 at +6.1 s**: up to 600 s for a real suite, after STOPPED. It was never backed up.
- **alone-run case:** run18b-c, 2/2. TERM went while sens-import was preparing, a window of about 1 s.
  - The queue was gone at +2.5 s.
  - The 20 s fake audit-import BASELINE ran to exit 0 at +20.3 s, up to 900 s for real.
  - alone-run, its watcher and the live lock stayed alive until then. alone-run's `trap 'exit 143' TERM` waits for its foreground
    sens-import.
  - A relaunch meanwhile waits on that lock.
- **Random TERMs never hit it.** 8 tries with fast suites (run15) and 10 with 2 s suites (run16): no suite started after STOPPED, and all
  in-flight runs recorded 143.
- **Fix:**
  - In `stop()`: `kill $LANES $FG; endruns; sleep 2; endruns`. Better, repeat `endruns` until `$FG` and the lanes are gone, with a bound.
  - In alone-run, run sens-import as `"$B/sens-import.sh" … & SI=$!; wait $SI`, and have the TERM trap `kill $SI` and end its recorded run.

**SF3. TERM to the queue's PID during a foreground step waits for the step to end.**
- **What is not `fgw`.** `runs` for check, verify:grid and standards (600 s each), and `bk` (backup-run, minutes with push retries), still
  run in the foreground.
- **Reproduction:** run9. TERM came 2 s into a 15 s check. The trap ran when check ended: the check `.exit` came +12.9 s after the TERM,
  and the queue was gone at +15.4 s.
- **So the claim is half true.** 2c's "long steps run in the background and are waited for, so a signal is handled at once" holds for
  alone-run and sens.sh only.
- **A group TERM is handled.** That is what `timeout` sends: run23 shows run.sh dies, `stop()` runs, the suite is ended and STOPPED is
  pushed.
- **Fix:** `fgw runs "$O/suites/check.log" 600 X=1 -- npm run check --silent; chk`, and the same for verify:grid and standards. A refusal
  inside is then in a subshell: it is recorded and caught by `chk`.

**SF4. overlap-watch's new 120 s give-up lets an unwatched audit-import count as "alone".**
- **How.** sens-import waits while `<outdir>/PAUSE` exists (a documented control) before it marks RUNNING. If that takes longer than the
  give-up, the watcher records "the run never started; watcher ended" and exits. The run then goes ahead unwatched, and alone-run accepts it
  because there is no OVERLAP line.
- **Reproduction:** run19a, with the bound at 3 s via `ctl/wbound` and PAUSE held 8 s. A foreign process (listed for the watcher) ran
  throughout.
  - Result: `baseline audit-import: ACCEPT`, and the queue finished DONE with exit 0.
  - Control run19ctl, without PAUSE: the same overlap was caught in all 3 attempts. STOPPED, exit 4.
- The same silence affects any run shorter than the 1 s poll (fake suites only).
- **Fix:** alone-run counts an attempt as alone only if OVERLAP.txt has `<id>#<a> watch start` … `watch end` with no OVERLAP between.
  Otherwise it repeats the attempt. Or the watcher keeps waiting while PAUSE exists.

**SF5. Following `backedup`'s own refusal advice can produce a run with no backups.**
- **Reproduction:** run22. Origin's branch was pushed from elsewhere, so it was ahead of REPO.
  - The launch refused: "… which REPO does not have yet: fetch it (git -C … fetch origin claude/v200-fixes-wip) and launch again". That is
    correct.
  - After that exact fetch, the launch passes. But the local branch is still behind, so every push is rejected as non-fast-forward.
  - Result: 5 `backup FAILED` lines, exit 6, after the whole run.
- **Fix:** in `backedup`, also require
  `pg merge-base --is-ancestor "$tip" refs/heads/claude/v200-fixes-wip`, and say "bring claude/v200-fixes-wip up to date
  (git pull --ff-only)".
- **No false stop in normal use.** Every session commits in /home/user/orbit-board and pushes from it, so the tip is local. `backedup` runs
  once at launch, never mid-run.

**SF6. A failed stop backup is invisible.**
- **Why.** `stop()` discards each backup's output and exits with the stop code.
- **Reproduction:** run21. TERM during the lanes with every backup failing gave exit 3, the same as a good stop, with no FAILED anywhere
  and no STOPPED record on the remote.
- **Fix:** keep each stop backup's exit status. Append `stop backup FAILED (exit x)` to the local summary and print it to stderr.

**SF7. Lower priority:**
- **backup-run still reads HEAD after its commit** (60c984c SF7, remainder).
  - B6 (`$W/unit/backup/results.txt`): a post-commit hook commits right after. backup-run reports `the branch moved … not pushed`, exit 3,
    although its own commit `a4a12a9` held only its destination.
  - The next backup then pushes the hook's commit unchecked. That is benign, but the check still is not of "the commit it made".
  - Its `backed up … at <HEAD>` message can name another run's commit. In run12, alone-run reported the queue's `4b9d0a3`.
  - Fix: `git commit … && C=$(git rev-parse HEAD)` is still racy. Use `commit-tree` with `update-ref <ref> <new> <old>`, and print `$C`.
- **Strays in REPO.** backup-run makes empty `completed/` and `mutants/` dirs in REPO for every destination. After a failed `git add` it
  leaves copied, untracked files there (run13). In orbit-board those are strays in the lead's worktree.
- **`stop()` ignores TERM, INT and HUP for its whole length**, including up to three backups with 4×120 s pushes each. Only KILL ends it.
  That is acceptable, but it is why MF1's 120 s bound fails.
- **Runs ended by a stop** (exit 143) are filed under `completed/`. Cosmetic.
- **Config still controls where backups go.** backup-run pushes to `origin` as REPO's config defines it. A planted
  `remote.origin.pushurl`/insteadOf would send evidence elsewhere while `backedup` (fixed URL) refuses the next launch. This needs a write
  to orbit-board's `.git/config`, the same class as 60c984c SF6.
- **`/.git`.** `git -C /` would read `/.git/config` if a repository ever existed at `/`, which only root can write. I showed it with a
  stand-in directory (`unit/lsremote`, case 2). `/` is not a repository now. An optional guard is `[ ! -e /.git ]`.
- **`# cmd:` is still not checked** by the gate (latent, unchanged).
- **Self-test coverage.** Still no case past the clone check. A scratch REPO or a namespace-mounted REPO (as in my bootstrap) would let it
  cover the stop paths without touching orbit-board.

## Q1. The 60c984c findings, and the e2e stop paths

For every run below, the summary on the scratch remote was checked against the local summary.

| Run | Path | Exit | summary-all.txt with DONE/STOPPED pushed | Suites started after STOPPED | Watcher or recorded run alive after the queue | Mutant `.json.txt` |
|---|---|---|---|---|---|---|
| 1 | happy path | 0 | yes (DONE), byte-equal to local | — | none; lock cleared | 5 committed (4 mutants + applicability), 0 `.json` |
| 2 | TERM during the lanes | 3 | yes | 0 (2 in flight ended, 143) | none | — |
| 3 | verdicts.tsv altered: refusal in a lane (`$(gv)`) | 2 | yes, plus REFUSALS.txt; lane lines say "REFUSED (see REFUSALS.txt)" | 0 | none | — |
| 4 | sens.sh altered: main-shell `vh` refusal | 2 | yes (`STOPPED … refused: sens.sh is …`) | 0 | none | 2 committed |
| 5 | never quiet (bound 4 s), someone else's lock | 4 | yes; import/summary "never 30 quiet seconds … of 03:48:31 … stopped 03:48:35" pushed | 0 | none; **the other lock kept** | — |
| 7 | sens-import altered during quiet(): alone-run refusal | 2 | yes, plus REFUSALS.txt | 0 | none; the watcher never started; lock cleared | — |
| 8 | three TERMs, the push slowed 6 s | 3 | yes; 1 STOPPED line (no re-entry) | 0 | none | — |
| 9 | TERM during foreground check | 3 | yes, **but only after check ended** (SF3) | 0 | none | — |
| 10 | TERM during the BASELINE (fgw alone-run) | 3 | yes; import BASELINE (143) and OVERLAP pushed | 0 | none; lock cleared | — |
| 11 | TERM during sens.sh (fgw) | 3 | yes; sens-new-recon (the stage in progress) pushed | 0 | none | 3 committed |
| 12 | TERM during alone-run's own backup (push +8 s) | 3 | yes; both backups landed (queue 20.4 s) | 0 | none | — |
| 13 | alone-run's backup fails | **0** | yes (DONE), **no FAILED; BASELINE never pushed** (SF1) | — | none | 5 |
| 14 | every backup fails | **6** | n/a; DONE says "with at least one FAILED backup; exit 6" | — | none | — |
| 15a-h, 16a-j | random TERM, fast and 2 s lanes | 3 | yes | 0 | none | — |
| 17a-c | TERM as a lane run starts | 3 | yes | 0 started after, but 1 run **finished exit 0 at +6.1 s** (SF2) | that run, until it ended | — |
| 18b-c | TERM while sens-import prepares | 3 | yes | BASELINE **ran to exit 0 at +20.3 s** (SF2) | alone-run, watcher, run, **lock** until +20.4 s | — |
| 19a / ctl | PAUSE longer than the watcher's give-up | 0 / 4 | yes | — | — | — (SF4) |
| 20 | npm run check fails | 5 | **ABSENT** (MF2) | — | none | — |
| 21 | TERM while backups fail | 3 | no, and **nothing says so** (SF6) | 0 | none | — |
| 22 / 22b | origin ahead / after the advised fetch | 2 / **6** | refused / all 5 backups failed (SF5) | — | none | — |
| 23 | launcher `timeout -k 10 12` expires during check (group TERM) | 124 (bx) | yes | 0 | none (suite ended) | — |

| 60c984c finding | Status | Evidence |
|---|---|---|
| **MF1** the queue's records never reach the backup | **Partly fixed** | <ul><li>`summary-all.txt`, runner-blobs, blobs, manifest and applicability now go up; DONE and every STOPPED through `stop()` are pushed (runs 1-12, 23).</li><li>Not the check-failed exit 5 (**MF2**, run20).</li><li>A failed stop backup is silent (SF6).</li></ul> |
| **SF1** a signal stop leaves the lanes running | **Fixed**, with a race | <ul><li>Runs 2, 8, 15, 16: no suite starts after STOPPED, and in-flight runs record 143.</li><li>Residual 0.3-1 s start-up window (SF2; runs 17, 18).</li></ul> |
| **SF2** main-shell refusal bypasses `stop()` | **Fixed** | Run 4. It caused **MF1** (pre-start refusals now push). |
| **SF3** the watcher outlives alone-run | **Fixed** | <ul><li>Run 7: sens-import is checked before the watcher, and `kill $W` is in the EXIT trap.</li><li>The new give-up opens SF4.</li></ul> |
| **SF4** exit 0 with failed backups | **Partly fixed** | <ul><li>Exit 6 on the queue's own failures (run 14).</li><li>alone-run's failures are not counted (SF1, run 13).</li><li>Stop-backup failures are silent (SF6).</li></ul> |
| **SF5** `stop()` backs up suites only | **Fixed** | Suites, import and the stage in progress (runs 10, 11). |
| **SF6** repo-local insteadOf redirects origin | **Fixed** | `extra/insteadof`: the redirect is live with plain git, but the queue refuses: "10166fb… is not on origin's claude/v200-fixes-wip (now 9b10e2a…)". The residual is `/.git` (root only). |
| **SF7** post-commit check reads HEAD | **Partly fixed** | A parent check was added. It still reads HEAD, so B6 gives a false "branch moved" (benign). |
| **SF8** alone-run removes another run's lock | **Fixed** | Run 5: the lock was kept and waited on. The trade-off: a stale lock (after a KILL) costs an hour, then exit 5. |
| **SF9** mutant `.json` never committed | **Fixed** | `.json.txt` was committed in runs 1, 4, 11 and B8, against orbit-board's own `.gitignore`. |
| **SF10** minor items | **Mostly fixed** | <ul><li>Preamble refusals are recorded.</li><li>The lane line says "REFUSED (see REFUSALS.txt)" (run 3).</li><li>quiet() gives its start time (run 5).</li><li>Still open: `# cmd:` unchecked, and no self-test case past the clone check.</li></ul> |

## Q2-Q4, briefly

**`stop()`**
- `trap ''` prevents re-entry: three TERMs gave one STOPPED (run 8).
- `kill $LANES $FG` plus `endruns` end the lanes, alone-run, sens.sh and their recorded runs (runs 2, 10, 11). The exception is the
  start-up race (SF2).
- The best-effort loop backs up suites, import and CURBK (runs 10, 11, 12). It discards failures (SF6).
- Children inherit the TERM-ignore. backup-run's `timeout 120 git push` still works, because timeout resets the handler for its child.

**`refuse` with `$BASHPID`**
- It stops only in the main shell (run 4).
- Inside `$( )`, lanes and the `( vh … )` in `stop()`, it records and exits 2, with no recursion (runs 3 and 7).
- Its first casualty is MF1.

**`fgw`**
- It works for alone-run and sens.sh (runs 10, 11).
- It is not used for `runs` or `bk` (SF3).

**alone-run**
- Lock waiting is correct: it waits on any lock and removes only its own (run 5).
- The EXIT and TERM traps clear the lock and the watcher (runs 7, 10).
- TERM waits for the foreground sens-import (SF2).

**overlap-watch's 120 s give-up**
- It turns a possible endless wait into an unwatched run that is accepted as alone (SF4).

**`backedup`**
- **Redirection (Q3).** The URL is fixed, there is no system or global config, `-C /`, and the environment is cleaned by `env -i`. Nothing
  in the repository can redirect it (`extra/insteadof`; `unit/lsremote`).
  - `~/.gitconfig` and `~/.config/git/config` are ignored under `GIT_CONFIG_GLOBAL=/dev/null` (lsremote case 3).
  - The proxy is passed through, but cannot forge GitHub's TLS without a CA in the fixed bundle.
- **Other ways to fool it.**
  - I tried a planted commit-graph: substituting the pinned commit's tree, and a first parent so an unpushed commit looks like an ancestor of
    the tip. Neither changed `rev-parse`, `ls-tree`, `archive` or `merge-base --is-ancestor` (`extra/commitgraph`).
  - What remains needs root writes to `/.git` or orbit-board's object store, which is outside a reasonable threat model.
- **False stop (Q3).** Refusing when the tip is not local causes no false stop in normal use (SF5). It is a launch-time refusal only.

**backup-run**
- It copies the new record list; `.json.txt` naming is correct (B8).
- It does not sweep in someone else's staged file (B1).
- The parent check is conservative (B6, SF7).

**Verdicts (Q4)**
- **Unchanged.** The gate, run.sh and verdicts.tsv bodies are byte-identical to 60c984c apart from the preamble.
- **No false ACCEPT.** I found no ACCEPT of an unfinished or failed run.
  - Stops record 143 and are refused.
  - The SF2 run that escapes finishes after STOPPED and is never gated.
  - A relaunch needs a new outdir.
- **Every refusal stopped the queue.** That covers lane, main-shell, alone-run, `$( )` and backup-run refusals (runs 3, 4, 7; unit B).
- **No false refusal of a good baseline:**
  - run 1: 13 baselines plus verify:grid all ACCEPT on the real endings;
  - G18: 13/13 real logs ACCEPT in my self-test.
- **All 13 rows match their real endings:**
  - I read check.mjs:635, legacy-fsrc, boot-same, standards-check.mjs:436-438, audit-inject:657-672, and the rule then `ALL CHECKS PASSED`
    in the other seven jsdom audits;
  - audit-ui at `claude/v200-ui` (now **90ccabf**, which moved during my review; only `ui-concept/CHUNK3.md` changed since 5a298b7) has the
    rule then `ALL CHECKS PASSED`, then `process.exit(0)`, at :1089-1090;
  - the suites' last 12 lines are unchanged from f7cddb7 to orbit-board's current HEAD 9b10e2a. audit-recon.mjs, mutate.mjs and the board
    changed in content, but not in their endings.

## Self-test re-run

- **Bootstrap (`$W/BOOTSTRAP.txt`).** It is the lead's command with my directory: archive cccb714's `recovery/v200/bin` from the real
  orbit-board into `$W/selftest-cccb714/runner`, `chattr -R +i`, then from cwd /home/user/Word-Matching-:
  `setsid -w timeout -k 10 900 …/runner-selftest.sh cccb714… $W/selftest-cccb714`.
- **The one difference.** It ran inside `unshare -m --propagation private`, with a scratch clone of orbit-board (`$W/st/orbit-board-clone`,
  at 9b10e2a, origin = `$W/st/remote.git`) bind-mounted over /home/user/orbit-board. I did this because of MF1: run as-is, it would have
  committed and pushed to orbit-board. The snapshot itself is untouched by this.
- **Wrapper and PIDs.** It ran via `$W/bx.sh` (recorded group 636); the self-test's own PID was 641.
- **Snapshot.** All 26 blobs equal the commit (`$W/snap-blobs.txt`; also verified by its own snapcheck).
- **Result.** `selftest done 04:07:52 PM ET: 0 failing case(s) of 41`, exit 0. **41/41 PASS**, row for row identical to the lead's
  `results.tsv` (`$W/lead-results.tsv`).
- **Side effect, as predicted.** A6 and A21 committed and pushed `4520907` and `4c3ace9` into the scratch clone and remote.

## Artifacts (all under $W)

| Path | What it holds |
|---|---|
| `VERDICT.md` | This file |
| `pids.txt` | Every group I started, via `bx.sh`, plus the foreign sleeps. The run.sh PIDs are in `e2e/out-*/pids.txt` and `selftest-cccb714/pids.txt`. **None alive at 4:17 PM ET.** |
| `BOOTSTRAP.txt`, `bx.sh`, `snap-blobs.txt`, `lead-results.tsv`, `selftest-cccb714/` | The self-test re-run: results.tsv, HEADER.txt, selftest-run.log, cases/ |
| `st/` | The scratch clone and remote used as REPO for the self-test. MF1's two commits are there. |
| `src/` | cccb714's `recovery/v200/bin` (unfrozen copy, for reading) |
| `diff-2c.txt` | 60c984c→cccb714 diff of `bin/`, without final-tree-v5 |
| `e2e/` | `build-harness.sh` (REPO **and ORIGIN**, `.gitignore`, `ctl/wbound`), `build-clone.sh`, `launch.sh`, `check.sh` (the five checks), `run*.sh`, `run*.out`, `run*.queue.out`, `out-run*`, the scratch `repo`/`repo-remote.git`, `brepo`, the fake `clone` and `clone-cf` (check fails), `LAUNCHES.txt` |
| `unit/backup/results.txt` | B1 (staged file not swept), B8 (record list, `.json.txt`), B6 and B6b (post-commit race) |
| `unit/lsremote/results.txt` | What can still redirect the fixed-URL ls-remote |
| `extra/insteadof/results.txt` | 60c984c SF6 re-run: refused |
| `extra/commitgraph/results.txt` | Planted commit-graph (tree and parent): not fooled |
| `orbit-state-before.txt`, `orbit-state-after.txt`, `orbit-head-before-selftest.txt` | orbit-board HEAD, refs, config md5, info/, hooks, FETCH_HEAD, index mtime |

## Rules kept, and notes

**orbit-board.** Nothing was edited, staged, committed or pushed in /home/user/orbit-board, /home/user/orbit-ui or any worktree, and no
refs, config, grafts or hooks were made there.
- **My commands there were read-only:** `show`, `archive`, `log`, `ls-tree`, `rev-parse`, `for-each-ref` and `config --list`, plus serving
  as a clone or fetch source, with `GIT_OPTIONAL_LOCKS=0` where git might write.
  - My first command was a plain `git status --short`, at 3:38:48 PM ET. It left the index mtime at 19:38:30 UTC.
- **Unchanged:** the config md5, info/ (only `exclude`), FETCH_HEAD, and hooks (none).
- **What moved, and who moved it.** Other sessions moved HEAD from f7cddb7 to 9b10e2a (9ef4f28, 0b4144a, d66dd60, 6734075 and 9b10e2a,
  between 3:39 and 3:58 PM ET) and claude/v200-ui from 5a298b7 to 90ccabf. The index mtime changed at 4:10:43 PM ET, and no command of mine
  wrote to it.

**Scratch only.** Every git-state attack, hook, backup and push used scratch repos, clones and bare remotes under `$W`.
- The only network access was read-only `ls-remote` of the fixed GitHub URL.
- The mount namespace was private to my self-test's process tree.

**Not run.** I never imported or executed mutate.mjs; the fake catalog is read as text by mkmanifest, mkmut and mcread. I ran no
audit-import, Playwright or product suite.

**Bounds and cleanup.**
- Every command was bounded.
- **My only kills were by recorded PID:** TERMs to my own e2e queue PIDs (the tests themselves) and my own recorded sleeps.
- **Immutable files.** `chattr -i` was used only on my snapshots (`$W/e2e/out-*/runner`, `$W/selftest-cccb714/runner`,
  `$W/extra/insteadof/out/runner`). **0 immutable entries remain under `$W`** (4:18 PM ET).

**One slip, outside my directory.**
- At 3:44:37 PM ET my first `build-clone.sh` still held the 3b reviewer's path. It re-ran `git init` in
  `../review-runner3b/e2e/clone` and rewrote its files with **identical content**.
- Afterwards: status clean, HEAD 30d78f2 and `clone.pin` unchanged. The commit step found nothing to commit, so only file mtimes and that
  clone's index changed.
- Nothing else there was touched.

**Messages.** Two agent messages addressed to "the agent using k-/K- labels in rec/L3/u14" arrived during this review. I am not that agent,
and they said to ignore them if so, so I did not act on them.
