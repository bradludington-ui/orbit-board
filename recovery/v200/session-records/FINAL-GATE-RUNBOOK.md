## BRAD'S DECISIONS, 18 Oct 2026 (given between 7:15 and 7:25 AM ET) -- these override anything below


**Added 18 Oct (Brad, AskUserQuestion, answered between 8:56 and 9:13 PM ET):** G16: the PR comes from claude/orbit-v2.00, fast-forwarded to the final integration tip when the gate passes. G22: run both cross-track reviews, read-only, beside the gate; only a lost-work or money must-fix holds the PR. G6: U28 deferred with its limit.

1. The mutation lanes run AFTER the PR is merged: the final-tree queue's sensitivity runs, the 135-mutation lane and the coverage of the new v2.00 mutations (G1). Before the merge: commit checks, the full audit-import ALONE, UI-C1's checks, integration, bundle, pin, every suite on the final tree (the queue's baseline), verify:grid in both font lanes, the evidence matrix, the PR.
2. The UI work (S1-S5, UI-C1) is IN the PR.
3. The gate is TEXT-ONLY: every suite on the final tree; mutants only from mutate.mjs as text; mutate.mjs is never executed (G3).
4. recovery/ and ui-concept/ are IN the PR (G8).
5. verify:grid's three UI items (G4): row-controls -- RECORD the 5 new intended controls (--record); toolbar-fits at 1152 px -- CARRY as a named limit in the PR and NEXT-VERSION; layout-fits configuration D x8 -- CARRY as a named limit.
6. A release blocker not clean holds the PR; blockers may run up to 8 rounds. Non-blockers clean by 8 PM ET Sunday go in.

# ORBIT v2.00 final gate: RUNBOOK for Sunday 18 Oct 8 PM ET to Monday 19 Oct about 7 AM ET

Written 18 Oct 2026, 6:25-7:07 AM ET (`TZ=America/New_York date`). Plan only.

**What I ran to write this:**
- In `/home/user/orbit-board`: only read commands: `git show`, `log`, `diff`, `ls-tree`, `rev-parse`, `merge-base`,
  `rev-list` and `branch`. I also ran one `git status --short` at the start, which may refresh the index's stat cache. It was
  clean. Nothing was edited, staged, committed, pushed or checked out there, in `/home/user/orbit-ui`, or in `$SP/ui-c1-wt`.
- `mutate.mjs` was only extracted as text with `git show` into `$FG/work/`. I read it with `rec/bin/mkmanifest.py`,
  `mcount.py` and a 3-line id lister (`$FG/work/ids.py`, which uses `mcread.py`), all with `python3 -I`. It was never
  imported or run.
- One trial three-way merge (`git merge-file`) on text copies in `$FG/work/mergetrial/`.
- `df`, `free`, `uptime`.
- Read-only GitHub calls: the PR list and PR #10, plus the routine list.
- **No test, suite, `--help` or dry-run was run.**

Everything below uses these names. Paste this block first in every shell:

```sh
SP=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad
R=/home/user/orbit-board            # stays checked out on claude/v200-fixes-wip ALL NIGHT (backup-run.sh needs it)
FG=$SP/rec/L8/finalgate
RS=2bfb59022ec74e1abe36a7cfd6a13ce5aabd9aed      # the approved runner (RUNNING-CHECKS.md, 13 Oct 5:17 PM ET)
BASE0=1c945375335ba4251a0f900fbdb68381350a0adb   # claude/orbit-v2.00, the reset base; ancestor of both branches and of main f9b4413
UIB=4a6f7c73ebf9018f6b1b14087cb5ec560a9bbb20     # merge base of claude/v200-ui and claude/v200-fixes-wip
ORIGIN=https://github.com/bradludington-ui/orbit-board
LOCK=$SP/AUDIT_IMPORT_RUNNING
G="git -c user.name=Claude -c user.email=noreply@anthropic.com -c core.hooksPath=/dev/null"
et(){ TZ=America/New_York date '+%-I:%M:%S %p ET'; }
# snap <dir>: <dir>/runner = recovery/v200/bin at the runner commit, frozen (the runner's own BOOTSTRAP form)
snap(){ mkdir "$1" "$1/runner" && git -C $R archive $RS recovery/v200/bin | tar -x -C "$1/runner" && chattr -R +i "$1/runner"; }
# renv <dir>: what alone-run.sh / sens.sh / backup-run.sh / run.sh need outside the queue (vh() checks them)
renv(){ export RUNNER_SHA=$RS SNAPROOT=$1/runner SNAP=$1/runner/recovery/v200/bin RUNNER_PIDS=$1/pids.txt RUNNER_REFUSALS=$1/REFUSALS.txt; B=$SNAP; }
# quietnow: prints nothing when no node / Chromium runs anywhere (alone-run's own test, rec/bin/alone-run.sh foreign())
quietnow(){ pgrep -a -x node; pgrep -af '^/opt/pw-browsers'; pgrep -a -x chrome; pgrep -a -x chromium; }
# records <dest-under-recovery/v200> <message>: a records-only commit of that path, refused if anything else is staged
records(){ $G -C $R add -- "recovery/v200/$1" && [ -z "$($G -C $R diff --cached --name-only | grep -v '^recovery/')" ] \
  && $G -C $R commit -q --only -F <(printf '%s\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01MqCBDiYHPZfnyapxhXKxBm\n' "$2") -- "recovery/v200/$1" \
  && for i in 1 2 3 4; do timeout 120 git -C $R push -q origin claude/v200-fixes-wip && break; sleep $((2**i)); done; }
# txtcopy <src> <dst>: text evidence only. *.html is never copied (its sha256 goes to EXCLUDED.txt). *.json becomes
# *.json.txt, because orbit-board ignores *.json on purpose. node_modules, clones and git archives are skipped.
# MANIFEST.sha256 is written last.
txtcopy(){ mkdir -p "$2"; ( cd "$1" && find . -type f ! -path '*/node_modules/*' ! -path '*/clones/*' ! -path './before/*' ! -path './after/*' ! -path '*/.git/*' -print0 ) |
  while IFS= read -r -d '' f; do case "$f" in *.html) sha256sum "$1/$f" | sed "s#  $1/#  #" >> "$2/EXCLUDED.txt";; *) d="$2/${f#./}"; [[ "$d" == *.json ]] && d="$d.txt"; mkdir -p "$(dirname "$d")"; cp -p "$1/$f" "$d";; esac; done
  ( cd "$2" && find . -type f ! -name MANIFEST.sha256 -print0 | sort -z | xargs -0 sha256sum > MANIFEST.sha256 ); }
```

**Standing rules** (README, RUNNING-CHECKS, HARD RULES of `rec/L8/commit-check.js`):
- Times are Eastern, from the clock, and never later than it.
- `mutate.mjs` is read as text only.
- Never run `playwright install`.
- The board stays the empty template.
- Every command is bounded. A timeout is incomplete, never a pass.
- **The full `audit-import` runs ALONE**, under the `$LOCK` lock and after 30 quiet seconds (`alone-run.sh`). `audit-board`
  runs alone too, except inside the approved queue's lane.
- Nothing merges, and nothing goes to `main` or `claude/orbit-v2.00`, without Brad's go.

---

## 0. BEFORE 8 PM: gaps found (fix or decide each before the cut)

The gaps are ordered by how hard they hit the 7 AM target. "Decision" means Brad's call. Everything else is lead work.

| # | Gap (what I found, with its source) | What to do before 8 PM |
|---|---|---|
| G1 | **The queue's manifest maker is stale, so the queue silently skips most of the new mutations.** `mkmanifest.py` at runner `2bfb590` maps suites only for `r1-5, u2, u13, u1, u14, ui3`. On the branch now (`96877da`), 61 v2.00 ids get suite `?`: U20 2, U30 12, U3 10, U4 12, U41 20, U42 5. U10 adds 62 more. `final-tree-v5.sh` (lines 188-202) runs only rows whose suite is one of `audit-import/recon/board/ui`. So these ids are never run, never listed NOT APPLICABLE, and never counted as held. Another 53 (U34 `v200-yearsel-*` 33, U36 `v200-regtext-*` 20) fail its prefix regex and are filed as **held**, mixed into the 135. The late tracks add about 170 more `?` ids (U37 71, U40 about 49, U44 72, U18 26, U9 23 + U43 3, U19 25) and about 130 more mis-held ones (cycreg 64, adoption 33, U9L 18, U19H 15). Counts are in Appendix A. | **Decision (recommended: keep runner `2bfb590`, as Brad decided).** Cover every id the queue skips or mis-files in the **presweep lane** (step 10a). The matrix lists every id with its lane. The alternative is a runner correction 2f (a new `mkmanifest.py` map, then self-test, independent review and Brad's OK). It gives no time back: with full runs it would make the queue 25-50 h (Appendix B). |
| G2 | **The queue cannot finish by 7 AM, even with only the 93 ids it does run.** Its own sensitivity is 19 audit-import runs alone (sequential, 10-14 min each), 34 whole audit-recon runs, 37 audit-ui runs and 3 audit-board runs, with no first-fail and one at a time. Estimate: **9.0-13.4 h, central about 11.4 h** (Appendix B). Started at about 12:05 AM, it is DONE at about 9:05 AM-1:30 PM, central about 11:30 AM. | **Decision.** (a) Move the non-blocker cut earlier than 8 PM. Each hour earlier moves the whole night an hour earlier. For DONE by 7 AM (central), the pin must be by about 7:35 PM, so the 8 PM-midnight block starts by about 3:30 PM. (b) Or keep 8 PM, open the PR at about 7 AM as a draft marked "evidence in progress, not for merge", and fill the matrix as the queue ends. (c) Or a Monday-afternoon PR. |
| G3 | **No recovery-era definition of "the full gate" exists.** `AGENTS.md` and v1.99 define the gate as `npm run validate:math`. Its stage 6 runs `node tools/export-audit/mutate.mjs`, which the standing rule forbids: four at a time, with audit-import beside other suites. That breaks "audit-import alone" (`tools/validate-math.mjs` lines 169-171; `mutate.mjs` `runSuite`). The v1.99 gate took **9 h 49 min** for 1,139 entries (PR #10; CLAUDE.md line 3841). Its restart-proof runner (`scratchpad/v199/gate-chunked/`) no longer exists anywhere on this machine. The 1,139 pre-v2.00 entries have never been swept on any v2.00 tree. | **Decision.** Recommended: the text-only form in step 10b. Stages 0, 1, 1b, 2, 5b and 5c run one by one. Stages 3 and 5 come from the queue and step 8 at the same pin. Stage 6 is covered for the v2.00 entries by the queue, the presweep and the 135 lane. **The 1,139 pre-v2.00 entries are named as NOT swept at this tree.** Alternatively Brad authorizes a sweep of them, which takes about 9-15 h and lands Monday or later. |
| G4 | **verify:grid cannot pass on the integrated tree.** The UI branch has three open failures, all Brad's calls, from ui-concept/CHUNK3.md "Not done, and open" and `evidence/ui/s1-s5-review/r2/README.md` lines 120-139: <br>- row-controls: 5 controls not recorded, and `--record` changes what the gate asserts; <br>- layout-fits D ×8 (m7, the look); <br>- toolbar-fits' one-line rule at 1152. <br>The `&&` chain stops at row-controls, tool 2 of 14 (7.7-8.3 s), so the queue's single verify:grid run shows almost nothing. | **Decision on the three UI items** (fix, record, or carry as named failures in the PR). Steps 4 and 8 run every tool on its own. Validate-math's stage 5 cannot be clean until these are settled. |
| G5 | **The bypass-lane scripts exist only in scratch** (`rec/L6/u28/evidence-u28/`: fc-nosegoe.sh `3c63a124`, fc-gate.sh `b6c79d01`, font-env.mjs `d3fb1295`, standin-template.mjs `c0d188cc`). Their round-3 review was stopped (13 Oct 4:42 PM ET). Their results on the integrated tree have never been measured. U28 Draft 1 (1): "Before the method is adopted, the lead runs all 14 tools both ways and compares." | Commit them as records: `txtcopy $SP/rec/L6/u28/evidence-u28 $R/recovery/v200/evidence/L6-u28 && records evidence/L6-u28 "v2.00 recovery: U28's bypass-lane scripts as approved by Brad (13 Oct), for the final verify:grid (records only)"`. Step 8 runs them from the committed copy and records their blobs. Its first run is the baseline, compared, not gated. |
| G6 | **U28's own commit c1** (one CSS rule plus four J checks, `rec/L6/u28/README.md` "Fix round 2") has not been reviewed past round 2 and has not been relaunched. On claude/v200-ui the rule is redundant (q55b: the four J checks pass on the merged board). | Decide: defer with its limit (recommended: the UI branch's columns already hold the figure), or relaunch mathU28 now. It cannot be clean by 8 PM unless it starts by about 1 PM. |
| G7 | **Commit texts exist only for finished tracks.** `nv.py`, `ledger.py`, `msg-*.txt` and the commit builder are written only for hold, U10, U41/U42 and U20/U30. None exists for cycreg, U37, U40 or U44 (the blockers), or for U18, adoption, U9/U43, U9L, U19, U19H, U41b or U28. The drafts are in `rec/L6/<track>/drafts/`. Placeholder rows (`U<n>`, `U<next>`) **start at U58**: U51-U55 are U10's and U56/U57 are Codex C1b's (RESTART log, 6:31 AM ET). | One text agent per blocker, now, from the U10 pattern: `rec/L8/u10/{nv.py,ledger.py,mkmsg.py,check.py,commit12.sh}`. U10's agent took 32 min, 4:01-4:33 AM ET. Dry-run each on the current draft and re-run it on the final copy. Number the rows in commit order. INTEGRATION-NOTES 6, 8, 11 and the U44 LEAD NOTE apply (step 1). |
| G8 | **The queue caps every non-import suite at 600 s** (final-tree-v5.sh lines 176/178/180/182; sens.sh). Whole audit-recon already reached 577.5 s (OOM, exit 137) and 600.9 s (timeout, exit 124) under load on 18 Oct (`rec/L8/cc/482f64c`, `c82ea62`). It took 493-498 s with cycreg's or U44's blocks (cycreg fr5; U44 `FR2K-S-audit-recon-head16`). If the pinned baseline times out, the recon sensitivity is INCOMPLETE. | Step 3b measures whole audit-recon alone on the combined tip. Over 480 s is a decision before the pin: accept, or a runner correction for the cap. |
| G9 | **audit-import's cap is 900 s + 20 s** (sens-import.sh). It ran 483-551 s at 7,491 lines (12 Oct). It is 9,131 lines now, about 9,550 with U40 and about 11,700 if all save tracks land. Estimate: 10-14 min, near the cap if all land. | Steps 3 and 7 measure it. If you can, take one timing run this afternoon in a lull (step 3's commands on the current tip, labelled "timing only"). |
| G10 | **NEXT-VERSION.md has no entry for the UI work** (chunks 1-3, M1, S1-S5, UI-C1). The UI branch never touches it (`git diff --stat 4a6f7c7 claude/v200-ui`). The ledger's UI rows are stale: UI-M1 says "Independent review running" and UI-C1 says "Approved". | Draft the entry (sources: ui-concept/CHUNK1.md, CHUNK2.md, CHUNK3.md; ledger UI rows) and commit it on claude/v200-fixes-wip **before** the integration merge (step 5), so the pinned tree carries it. |
| G11 | **The release tree brings in big folders.** With every commit kept, the PR to main brings `recovery/` (66.6 MB, 4,258 files at `96877da`, plus tonight's evidence) and `ui-concept/` (22.5 MB, 135 files). main has neither. The README says recovery/ "is not part of any release". | **Decision:** merge as built, or add one final records commit on the integration branch that removes `recovery/` (and `ui-concept/`) from the release tree. The history keeps them, and claude/v200-fixes-wip keeps them. |
| G12 | **Evidence is not on the branch.** The commit-check folders (`rec/L8/cc/*`, 6.1 MB of text) are not there, and neither are U32-U36's raw logs (cycreg logs/out/codex-b2, yearsel, regtext). The text backup (`recovery/v200/scratch-backup`) was last refreshed 13 Oct 5:28 PM ET. | `txtcopy` each `rec/L8/cc/<sha7>` to `recovery/v200/evidence/cc/<sha7>`, and U32-U36 to `recovery/v200/evidence/U32-U36/<track>`. Make one `records` commit each. Do this now for the finished checks and after each check tonight. |
| G13 | **No presweep tool exists.** Nothing runs each skipped mutation against its own block's focused harness at a given tree and pauses for the queue's alone runs. Also, `sens-chain.sh` (the 135 lane) never checks the lock. | Write `$FG/presweep.js` (a Workflow script cloned from `rec/L8/commit-check.js`; brief in step 10a). Self-check it on the current tip. Run `sens-chain.sh` one id at a time behind `qok` (step 10c). |
| G14 | **Disk: 2.1 GB free** at 6:46 AM ET and **1.4 GB at 7:06 AM ET** (`df -h /`). The night needs about 1.5-2.5 GB: kept queue mutants (93 × 3.8 MB), alone-run mutants, the clones, presweep copies, and two bundles of 21+ MB. | Clean finished mutant boards and clones by 7 PM, with manifests, as before (`rec/L8/deleted-*.tsv`). Check every bundle's exit status directly. Keep at least 3 GB free. |
| G15 | **No PR template** at main (no `.github/`; `git ls-tree -r origin/main` holds no template). | PR-DRAFT.md follows PR #10's own headings. |
| G16 | **The PR head branch** needs Brad's go: the README forbids any update to claude/orbit-v2.00 without it. | **Decision:** head `claude/orbit-v2.00`, fast-forwarded to the integration tip (`1c94537` is its ancestor; convention of PRs #2-#10), or a new branch `claude/orbit-v2.00-final`. |
| G17 | **U10 is still under check:** 8 of 12 done at 6:44 AM ET (`wf_8f7c5844-9a7`). | Do step 2 as soon as it passes (this morning), not tonight. |
| G18 | **The queue runs once and has no resume.** A container restart or idle reclaim kills it: on 11 Oct the container was reclaimed three times while idle. A rerun goes into a new outdir, costing 9-13 h. | Launch it detached, with a tracked waiter re-armed every 2 h, and the hourly routine on (step 7). Keep the night free of usage-limit risk: no fix agents after the pin. |
| G19 | **The records are behind.** RUNNING-CHECKS.md ends at 13 Oct 5:28 PM ET, and there is no STATUS-2026-10-18.md. The 14-18 Oct log is only in `rec/L7/RESTART-AFTER-RESET.md`. | Make one records commit (RUNNING-CHECKS update plus STATUS-2026-10-18.md) before 8 PM. The PR cites them. |
| G20 | **"verify:grid in both font lanes" is not in the queue**: v5 runs the chain once, with the container's fonts. | Step 8 runs both lanes, outside the queue. |
| G21 | **The hourly routine** `trig_01PhhHK97YTPeEsCZr3X2fvw` (`42 * * * *`) relaunches fix groups (its step 3, "6-7 agents"). Its node runs during a queue alone-run would make attempts OVERLAPPED, or starve `quiet()`, which stops after 1 h with exit 5. | Before the pin, change its prompt: after the pin launch no fix agents; check the queue (step 7 "Watching"); start parallel lanes only through `qok`. It already points to this runbook. |
| G22 | **The cross-track dry-run reviews were never re-run.** The exports and locked-view reviewers (INTEGRATION-NOTES 10) stopped 13 Oct 3:44 PM ET. The 5:51 AM ET note says "dry run to be redone after U37/U40/U10". | Decide: run the two cross-track reviewers on the combined tip between the last commit and the pin (agents, about 45-60 min each, reading and probes), or rely on the commit checks, the queue and the presweep. If run, they sit on the critical path. |
| G23 | **Blockers are at the round cap.** cycreg round 6 money has 1 must-fix. U40 r4, U37 r5 and U44 r3 each still have must-fixes (6:44 AM ET). | `fixes-state.js` takes `args.maxRounds` (cycreg 8). Give U37, U40 and U44 the same, so a blocker never stops for lack of a round. |

Other routines need no action. "Nightly ORBIT math validation" (`0 7 * * *`, 3 AM ET), the "data-loss fuzz" (5 AM ET) and the
"Weekly Interface Review" (Mon 4 AM ET) each start a fresh session of their own: their last runs carry other session ids.
They run on `main`, in other containers.

---

## 1. TIMELINE: Sunday 8 PM to Monday 7 AM ET

These are estimates. Sources are in Appendix B. The plan assumes the four blockers (cycreg U32/U33/U50, U37, U40, U44) are clean at 8:00 PM and that step 2 (U10) was done this morning. If a blocker is not clean, every row from step 1 on shifts by that delay, and the PR waits.

| Time (ET) | Step | Runs beside it |
|---|---|---|
| 7:30-8:00 PM | Pre-cut: G5, G10, G12, G14, G19 done. G21 routine prompt changed. Trial merge re-run at the tip (step 5). | anything |
| 8:00-8:10 PM | **Cut.** List the clean tracks. `touch $SP/DRAIN` and stop non-blocker fix runs. No new fix rounds after this. | — |
| 8:10-8:55 PM | (1) apply2.py, build the staged commits, mcount: about 10 min per track, one after another. 4 blockers, plus any non-blocker clean by 8 PM. | commit checks of tracks already built |
| 8:25-9:50 PM | (1) Commit checks (`rec/L8/commit-check.js`), at most 2 checker agents at once: 2 pairs × 35-45 min. Add about 40 min per extra non-blocker pair. | other checks (≤2) |
| 9:50-10:05 PM | (1) Cherry-pick or fast-forward, blob compare, push. Ledger records commit(s). | — |
| 10:05-10:20 PM | **(3) Full audit-import ALONE** on the combined tip (est. 10-14 min plus 30 s quiet). | **nothing** that runs node or Chromium |
| 10:20-10:28 PM | (3b) Whole audit-recon alone: a measurement for the 600 s cap (G8). | git-only work for step 5 |
| 10:20-10:40 PM | (5) Integration branch: two `--no-ff` merges in a worktree, then npm check (after 3b), mcount and the consistency checks. | 3b (git parts only) |
| 10:40-11:50 PM | **(4) UI-C1's checks on the integrated tree** (independent checker agent; 53 min measured on 13 Oct, plus setup). | (6a) bundle (git only) |
| 10:45-11:05 PM | (6a) Bundle, restore verification, records commit. | (4) |
| 11:50 PM-12:05 AM | (6b) **Pin**: clone, manifest, PIN record, push. | — |
| 12:05-12:20 AM | (7) Queue: npm check, then baseline audit-import ALONE. | **nothing** |
| 12:20-12:42 AM | (7) Queue: its two suite lanes, verify:grid (chain), standards, applicability. | nothing heavy (text work only) |
| 12:42-1:47 AM | (7) Queue: new × audit-import, 5 alone runs. | **nothing** |
| 1:47-3:31 AM | (7) Queue: new × audit-recon, 16 runs. **Window W1 opens.** | `qok` lanes: (8), then (10a) and (10b) |
| 1:50-2:30 AM | **(8) verify:grid, bypass lane** (lane B, 14 tools, chain, +6% stand-in). Lane S comes from step 4. | queue (recon) only |
| 2:30-6:20 AM | (10a) Presweep, 2 lanes (est. 3.6-4.8 h for about 430-575 ids). (10b) The gate's light stages, about 20-40 min, in lane 1 first. (10c) The 135 lane's cheap chain, after the presweep or interleaved. | queue (recon, then ui) |
| 3:31-6:21 AM | (7) Queue: new × audit-ui, 37 runs (W1). | `qok` lanes |
| 1:00-6:00 AM | (9) Matrix sections A, C, F, G drafted (text only). | anything |
| 6:21-9:23 AM | (7) Queue: reimpl × audit-import, 14 alone runs. **W1 closes**: the `qok` lanes pause by themselves. | **nothing** |
| ~7:00 AM | Status to Brad. PR-DRAFT filled with what is done; "evidence in progress" (G2 option b). | — |
| 9:23-11:30 AM | (7) Queue: reimpl × audit-recon ×18, then audit-board ×3, then DONE (range 9:05 AM-1:30 PM). W2 open for `qok` lanes. | `qok` lanes |
| after DONE | (10c) The 135 lane's audit-import fallbacks ALONE (n × about 13 min, n ≥ 1, unknown). Presweep fallbacks. (9) Matrix final. (11) PR body final. | — |

**Critical path:** last blocker clean → its commit and commit check (about 45 min) → push → step 3 alone run (about 15 min)
→ integration (about 20 min) → UI-C1 integrated check (about 70 min) → pin (about 15 min) → **the queue (9.0-13.4 h; about 75% of the path)**
→ the 135 lane's alone fallbacks → matrix → PR. The queue's audit-import phases are strictly serial and alone, so nothing
beside them shortens the path. The real lever is the **start time of the pin** (G2a).

## 2. Biggest risks to 7 AM, each with its mitigation

| Risk | Mitigation |
|---|---|
| R1. A blocker is not clean at 8 PM, so the PR waits. | Give blockers `maxRounds` 8 (G23). Run blockers first. Lead-made words-only fixes of a final must-fix still go through a review round. **Start the 8 PM block the moment the four blockers are clean**, even before 8 PM: non-blockers clean by then go in, and the rest wait (G2a). |
| R2. The queue runs 9-13 h, past 7 AM. | G2 decision. Use W1/W2 for every lane that is not an import lane (`qok`). Do the matrix text during the queue. Open a draft PR at 7 AM if Brad wants it. |
| R3. Pinned audit-recon or audit-import times out at its cap (600 s / 900 s), so that sensitivity is INCOMPLETE. | Steps 3 and 3b measure before the pin. Run nothing beside the queue's baseline lanes. A decision before the pin if the margin is under about 20%. |
| R4. A container restart or idle reclaim mid-queue: INCOMPLETE and a rerun (+9-13 h). | Detached launch, a tracked waiter, the hourly routine, and no idle stretches. Record `uptime` at each check. If it happens, record the stopped run INCOMPLETE, relaunch into a new outdir, and tell Brad. |
| R5. OOM kills: Chromium renderers (UI-C1 check 13 Oct, `dmesg`), audit-recon exit 137 (18 Oct). | At most one Chromium tool at a time. No fix agents at night. Retry once and record both attempts. Never count a crash as a pass. |
| R6. Disk runs out (2.1 GB free now). | G14 cleanup. Check `df` hourly. The 135 lane deletes its mutants. Delete each `qok` lane's mutant boards once its summary line is written. |
| R7. backup-run fails (busy index, or the branch moved), the queue exits 6 and logs stay local. | orbit-board stays on claude/v200-fixes-wip with a clean index. The integration is built in a worktree. The lead makes **no commits there while `pgrep -f backup-run.sh` prints anything**. Batch your own records for after DONE. |
| R8. A usage limit stops the night's agents (UI-C1 checker, presweep). | The queue is shell and unaffected. Schedule agent work before midnight and in W1. Watch usage at each hourly check. Use DRAIN as before. |
| R9. A mutant SURVIVES at the pin. | The presweep runs early in W1, so survivors surface by about 4 AM. The PR waits, or Brad accepts a named limit. Never re-label it. |
| R10. A conflict in the final integration merge. The trial at `254f29c` + `7df816c` was clean: board and mutate.mjs 0 conflicts, 1,541 entries each matching once. | Re-run the trial at each new tip (step 5, first block). Resolve add/add hunks only with `rec/L7/union.py` logic. Anything else is hand-resolved and recorded. |
| R11. UI-C1's integrated check fails, so the pin waits. | Run a provisional check on a trial integration this afternoon. It de-risks the harness paths and OOM handling; it does not count as the check. |
| R12. The skipped and mis-held ids leave a silent coverage gap. | The presweep plus a matrix row for every id (step 9 D). |

**Pieces that can start earlier on the current tip, without wasting work:**
- All text: G7 scripts, G10 entry, G12/G19 backups, the presweep script (G13), and matrix sections A, C, F, G.
- The provisional UI-C1 harness run (paths only).
- Timing-only runs of step 3 and 3b, which decide G8 and G9.
- The trial merges.

Results from any tree other than the pin are **not** evidence at the pin. Only tools, scripts and decisions carry over.

**What can run beside what:**
- Commit checks with each other (2 at a time).
- Git-only work (bundle, merges, records) beside anything except a backup-run in flight.
- `qok` lanes beside the queue's recon, ui and board phases only (W1, W2).
- **Nothing** beside step 3, the queue's baseline audit-import, or any queue import phase.

---

## 3. The steps

Steps are numbered as asked. **Execution order:** 2 (this morning), 1, 3, 3b, 5, 4, 6a (beside 4), 6b, 7, 8 and 10 in the
queue windows, 9, 11.

### Step 1: the commit-check path for a track that comes clean late

- **Purpose:** put a clean track on the branch with exactly its reviewed blobs, check what was committed, and push only after
  it passes.
- **Preconditions:**
  - Both reviewers of the track's last round returned 0 must-fix (its `wfstate/verify_<t>_r<N>_{money,tests}.json`).
  - The track's text scripts exist (G7).
  - `$G -C $R status --short` is empty.
  - orbit-board is on claude/v200-fixes-wip, which equals origin.
- **Commands** (one track at a time, in commit order; `T=<track>`, copies as its README lists, for example `fr7/c1`):

```sh
T=cycreg; COPIES="fr7/c1"                                   # from rec/L6/$T/README.md (its commit plan)
python3 -I $SP/rec/L7/apply2.py $T origin/claude/v200-fixes-wip $COPIES 2>&1 | tee $SP/rec/L8/apply2-$T-$(date +%m%d-%H%M).log
#   STOP (non add/add conflict): resolve by hand in $SP/rec/L7/merge on a-$T per rec/L7/INTEGRATION-NOTES.md, record it there
#   (as item 11 was), then compare each file's added/removed lines with the track's own copy-to-copy diff.
# texts + commits in a detached worktree; claude/v200-fixes-wip does NOT move yet (rec/L8/u10/commit12.sh pattern):
bash $SP/rec/L8/$T/commitN.sh            # builds v200-$T-staged on the tip; asserts every blob = a-$T's; NEXT-VERSION = dry run
mkdir -p $SP/rec/L8/$T/chk && for f in prioritization-board-grid.html tools/export-audit/mutate.mjs; do git -C $R show v200-$T-staged:$f > $SP/rec/L8/$T/chk/$(basename $f).txt; done
python3 -I $SP/rec/bin/mcount.py $SP/rec/L8/$T/chk/mutate.mjs.txt $SP/rec/L8/$T/chk/prioritization-board-grid.html.txt   # every entry once
# args for the check: one {sha,parent,subject,track,note} per commit; write rec/L8/args-cc-$T.json, then (the lead's tool):
#   Workflow({scriptPath: "$SP/rec/L8/commit-check.js", args: <contents of rec/L8/args-cc-$T.json>})
```

  Track-specific notes for the check's `note` or `commonNote`:
  - **U44:** the LEAD NOTE from INTEGRATION-NOTES "Codex round 2". Its notices must have no U50-type clause that is false
    for some entry, checked on the real confirm and reopen text.
  - **U40:** integrate the builder's own copy, never Codex's `2419366b`. U10's `cycBlock('Changing a destination')` stays
    the first statement of `flowSetEnt` (INTEGRATION-NOTES 6).
  - **U37:** must close U46 by test (ledger U46).
  - **U18:** U4's hold check sits right before `await driveWrite(...)`, after U18's re-read (INTEGRATION-NOTES 1, 4).
  - **adoption:** the nested clash words and three re-anchored entries (INTEGRATION-NOTES 2, 3).
  - **U19:** INTEGRATION-NOTES 5.
  - **U41b:** its copy is on `254f29c`; cherry-pick its diff.
- **After PASS** (each commit's `pass: true`; read every discrepancy):

```sh
OLD=($(git -C $R rev-list --reverse $(git -C $R merge-base v200-$T-staged claude/v200-fixes-wip)..v200-$T-staged))
TIP0=$(git -C $R rev-parse HEAD)
git -C $R merge --ff-only v200-$T-staged 2>/dev/null || $G -C $R cherry-pick $(git -C $R merge-base v200-$T-staged $TIP0)..v200-$T-staged
NEW=($(git -C $R rev-list --reverse $TIP0..HEAD)); [ ${#OLD[@]} = ${#NEW[@]} ] || echo "COUNT MISMATCH"
for k in "${!OLD[@]}"; do git -C $R diff --quiet ${OLD[$k]} ${NEW[$k]} -- . ':(exclude)recovery' || echo "BLOB MISMATCH ${OLD[$k]} ${NEW[$k]}"; done
git -C $R push origin claude/v200-fixes-wip
python3 -I $SP/rec/L8/$T/ledger.py $R/recovery/v200/UNRESOLVED-LEDGER.md <sha1> "<when1>" ...   # shas = NEW, when = commit + check times
txtcopy $SP/rec/L8/cc/<sha7> $R/recovery/v200/evidence/cc/<sha7>    # per checked commit; json -> .json.txt, boards excluded
records . "v2.00 recovery: <T> passes the lead's commit check; ledger texts with final shas (records only)"
```

- **Concurrency:** at most 2 checker agents at once (each runs ≤2 processes, LOCK rule). Never during step 3.
- **Duration (measured):**
  - per commit check: U20 15 min, U30 17, U36 about 17, U34 50, U41 about 11, U42 about 9 (13 Oct); hold U4 36, U3 39
    (18 Oct); U10 about 25-35 min per pair under load (RESTART log 4:33-6:44 AM ET).
  - apply plus build: about 10 min per track (estimate from the 4:02-4:33 AM ET U10 sequence, with scripts ready).
- **Evidence:**
  - `rec/L8/cc/<sha7>/`, copied to `recovery/v200/evidence/cc/<sha7>/` (text only, MANIFEST.sha256, EXCLUDED.txt).
  - The apply log, `rec/L8/<T>/`.
- **Pass:** every commit's check passes (focused block fails on the parent and passes after; every new mutant caught; mcount
  once; npm run check; the touched suites whole) and the blobs equal.
- **On failure:** the commit stays on `v200-$T-staged`, unpushed.
  - A harness or environment failure (OOM, timeout under load): re-run that one check alone.
  - A real failure: the track goes back to a fix round. **Blocker:** the PR waits. **Non-blocker after 8 PM:** dropped
    from v2.00; the branch is deleted locally after recording its blobs; its ledger row keeps the finding and gets the
    limit in plain words.

### Step 2: U10's twelve staged commits onto the tip, and one records commit (do it as soon as U10's check passes)

- **Purpose:** move the twelve checked commits (`7e30379`..`254f29c` on `16ceb83`) onto the tip `96877da` without changing
  one product byte, then record hold and U10 in the ledger.
- **Preconditions:**
  - All 12 pass in `wf_8f7c5844-9a7`.
  - The tip is still `96877da`, or later records only.
  - `16ceb83..96877da` touches only `recovery/`; I checked: `git diff --name-only 16ceb83 96877da` lists recovery files only.
- **Commands:**

```sh
[ -z "$($G -C $R status --short)" ] && P=$(git -C $R rev-parse HEAD) && echo "P=$P"
[ -z "$(git -C $R diff --name-only 16ceb83 $P | grep -v '^recovery/')" ] || echo "STOP: product changed since 16ceb83"
OLD=($(git -C $R rev-list --reverse 16ceb83..v200-u10-staged)); [ ${#OLD[@]} = 12 ]
$G -C $R cherry-pick 16ceb83..v200-u10-staged          # no -x: the trailer stays last; old -> new map goes into the records
NEW=($(git -C $R rev-list --reverse $P..HEAD)); [ ${#NEW[@]} = 12 ]
for k in $(seq 0 11); do
  git -C $R diff --quiet ${OLD[$k]} ${NEW[$k]} -- . ':(exclude)recovery' || echo "BLOB MISMATCH k=$((k+1))"
  [ "$(git -C $R log -1 --format=%B ${OLD[$k]})" = "$(git -C $R log -1 --format=%B ${NEW[$k]})" ] || echo "MSG DIFF k=$((k+1))"
  echo "$((k+1)) ${OLD[$k]:0:7} -> ${NEW[$k]:0:7}"; done | tee $SP/rec/L8/u10/moved-$(date +%m%d-%H%M).txt
mkdir -p $SP/rec/L8/u10/chk2 && git -C $R show HEAD:tools/export-audit/mutate.mjs > $SP/rec/L8/u10/chk2/m.txt && git -C $R show HEAD:prioritization-board-grid.html > $SP/rec/L8/u10/chk2/b.txt
python3 -I $SP/rec/bin/mcount.py $SP/rec/L8/u10/chk2/m.txt $SP/rec/L8/u10/chk2/b.txt     # expect 1504 entries, 1504 once (measured at 254f29c)
git -C $R push origin claude/v200-fixes-wip
# the ONE records commit: hold rows U3/U4, U10 rows (U10, U49, new U51-U55) and C1b rows U56/U57 (written by the lead)
python3 -I $SP/rec/L8/hold/ledger.py $R/recovery/v200/UNRESOLVED-LEDGER.md \
  e219a68 "14 Oct, 4:03 AM ET; the lead's commit check passed it 18 Oct, 4:36 AM ET" \
  16ceb83 "14 Oct, 4:03 AM ET; the lead's commit check passed it 18 Oct, 4:33 AM ET"
ARGS=(); while IFS=$'\t' read -r h d; do ARGS+=("$h" "$d"); done < <(TZ=America/New_York git -C $R log --reverse --format='%h%x09%cd' --date=format-local:'%-d %b, %-I:%M %p ET' $P..HEAD)
[ ${#ARGS[@]} -eq 24 ] && python3 -I $SP/rec/L8/u10/ledger.py --committed-on ${P:0:7} $R/recovery/v200/UNRESOLVED-LEDGER.md "${ARGS[@]}"
#   then the U56/U57 rows after U55. Their text is NOT written yet (from rec/L6/u41b/codex-c1b/REPORT-SUMMARY.md and
#   rec/L8/c1b/lead-c1b.log; G7). Also the U10 check results and the old->new map in RUNNING-CHECKS.md.
git -C $R diff --numstat -- recovery/v200/UNRESOLVED-LEDGER.md      # hold +2 -2, U10 +7 -2 -> "9 4" before U56/U57's +2
txtcopy $SP/rec/L8/cc/7e30379 $R/recovery/v200/evidence/cc/7e30379   # ... and the other eleven U10 check folders
records . "v2.00 recovery: U10's twelve commits moved onto 96877da (product blobs equal the checked ones) and pass the lead's commit check; ledger rows U3, U4, U10, U49 closed with final shas, rows U51-U57 (records only)"
```

- **Concurrency:** git only, any time, but not while a backup-run is in flight.
- **Duration:** about 15 min (estimate: twelve cherry-picks, the compare loop and two text scripts; the dry runs exist).
- **Evidence:** `rec/L8/u10/moved-*.txt`; `recovery/v200/evidence/cc/<12 folders>`; the ledger and RUNNING-CHECKS diff.
- **Pass:** 12 OLD → 12 NEW, no BLOB MISMATCH and no MSG DIFF, mcount 1504/1504, push OK, ledger.py prints `ok`. The numstat
  is as expected.
- **On failure:** `$G -C $R cherry-pick --abort`, or `git -C $R reset --hard $P` if nothing was pushed. Recheck the tip; the
  staged branch stays the source. hold `ledger.py` asserts each prefix occurs once; U10's refuses if any row past U50
  exists. Run U10's before writing U56/U57, as the README warns.

### Step 3: the full audit-import ALONE on the combined commits (and 3b: whole audit-recon, a cap measurement)

- **Purpose:** one whole audit-import on the final safety tip, alone, before integration (Brad's plan of 12 Oct, STATUS-12
  "Next steps" 1). It also measures the 900 s margin (G9). 3b measures audit-recon against the queue's 600 s (G8).
- **Preconditions:**
  - Every fix commit is pushed and no commit check is running.
  - `quietnow` prints nothing.
  - `$LOCK` is absent.
  - Disk is at least 2 GB free.
- **Commands:**

```sh
T=$(git -C $R rev-parse claude/v200-fixes-wip); T7=${T:0:7}; X=$FG/import-alone-$T7
C=$FG/clone-$T7; git clone -q $R $C && git -C $C checkout -q --detach $T && ln -s /home/user/orbit-board/node_modules $C/node_modules
snap $X && renv $X
$B/alone-run.sh $C $X/import combined-$T7/import "combined safety tip $T7: audit-import alone, before integration" BASELINE   # tracked background task, timeout 3600000
$B/gate.sh $X/import/BASELINE.log $T 'ALL CHECKS PASSED'        # expect: ACCEPT BASELINE.log
# 3b (after 3 ends; again nothing else node):
(cd $C && $B/run.sh $X/recon-whole.log 600 X=1 -- node tools/export-audit/audit-recon.mjs); $B/gate.sh $X/recon-whole.log $T 'ALL CHECKS PASSED'
grep -a '^# exit' $X/recon-whole.log
```

- **Concurrency:** **ALONE.** alone-run sets `$LOCK`, waits for 30 quiet seconds, and runs `overlap-watch.sh`, which
  records anything seen beside it. Git-only work may go on.
- **Duration:**
  - audit-import: 483.1 s and 550.7 s were the alone baselines at `4e90af4`/`a8891e1` (RUNNING-CHECKS "12:27 AM ET" table).
    Mutant runs took 486.6-554.0 s.
  - Estimate at this tip: **10-14 min**, scaled by suite length, 7,491 → 9,131-11,700 lines.
  - 3b: 5-8 min (estimate). The whole recon took 280.8 s (hold check, 18 Oct) up to 497.6 s (U44 head16, under load).
- **Outputs and backup:**
  - `$X/import/` (BASELINE.log, .exit, summary.txt, OVERLAP.txt). alone-run's own `backup-run.sh` commits it, records
    only, to `recovery/v200/evidence/combined-$T7/import/` and pushes.
  - 3b: `$X/recon-whole.log`. Back it up with `txtcopy $X $R/recovery/v200/evidence/combined-$T7/x` and
    `records evidence/combined-$T7 "..."`, skipping `runner/`.
- **Pass:**
  - alone-run exit 0.
  - `BASELINE (unmutated) | audit-import | # exit: 0 ... | ALL CHECKS PASSED`.
  - No `OVERLAP` line between the watch start and end.
  - gate.sh ACCEPT.
  - Duration under about 750 s (otherwise G9 goes to Brad).
  - 3b ACCEPT in under about 480 s (otherwise G8).
- **On failure:**
  - OVERLAPPED: repeated up to 3 times automatically (exit 4 after that). Find the process in OVERLAP.txt and stop its
    owner.
  - A failing check: run that block's focused harness on each fix commit's tree to find the commit, then go back to step 1
    (a lead-made fix commit with its own check), or drop a non-blocker commit with `git revert`, recorded.
  - TIMED OUT (exit 124): STOP. The queue would time out too, so G9 goes to Brad before any pin.

### Step 4: UI-C1 and its remaining checks (runs AFTER step 5, on the integrated commit)

- **Purpose:** Brad's "complete UI-C1's checks after integration". UI-C1 is already cherry-picked (`7df816c` on
  claude/v200-ui; `822918e` in `$SP/ui-c1-wt`). Every acceptance item in the 17-item table of
  `$SP/uichunk3/c1-check-7df816c/README.md` ("The acceptance items, one by one") is repeated, with **after** = the
  integrated commit and **before** = the same integration with `dd15956` in place of `7df816c` (RUNNING-CHECKS
  12 Oct 7:17 AM and 13 Oct 1:19 PM ET).
- **Preconditions:**
  - Step 5 is done and its tip is not moving.
  - `ui-backup/LATEST` is `7df816c` (it is).
  - Nothing else runs Chromium.
- **Commands:**

```sh
I=$(git -C $R rev-parse claude/v200-integration); I7=${I:0:7}; M1=$(git -C $R rev-parse claude/v200-integration^1)  # = merge 1 (safety)
UB=$FG/ui-before-$I7; git clone -q --shared $R $UB && $G -C $UB checkout -q --detach $M1 && $G -C $UB merge -q --no-ff --no-edit dd1595666b54f9a646385cacc650da1477ffcb6b
git -C $UB diff --stat HEAD $I                                    # must be exactly: prioritization-board-grid.html | 10 (5 lines, UI-C1's)
git -C $UB diff HEAD $I | git patch-id; git -C $R show 7df816c | git patch-id     # the two ids must be equal
```

  Then one independent checker agent works in `$SP/uichunk3/c1-check-$I7/`. Its brief is the 13 Oct checker's
  (`wf_1d59746c-45f`; RUNNING-CHECKS 13 Oct 1:19 PM ET), with:
  - before = worktree at `$UB` HEAD, after = `$I`;
  - the harness `$SP/uichunk3/c1-check-7df816c/{ex.mjs,cmp.mjs,rule-list.mjs,rv-smoke-c1.mjs,table.mjs,bin/*}`, with the
    paths changed exactly as its README's "Exact changes to the original harness" shows;
  - all 14 verify:grid tools run one by one at both trees. Those are **lane S for step 8**;
  - LOCK rule, ≤2 processes, never beside an audit-import run.

  Back up: `txtcopy $SP/uichunk3/c1-check-$I7 $R/recovery/v200/evidence/ui/c1-check-$I7 && records evidence/ui/c1-check-$I7 "v2.00 recovery: UI-C1's acceptance repeated on the integrated tree $I7 (records only)"`.
- **Duration:** 53 min measured (12:18-1:11 PM ET, 13 Oct, two lanes). Estimate 60-75 min with setup and the larger board.
- **Pass:** VERDICT PASS on all 17 items:
  - payload byte-identical, 24 clicks identical in A and R contexts;
  - `npm run check` exits 1 at before (the same 10 `jsa()` values) and 0 at after;
  - audit-ui counts per scenario identical; mcount once;
  - every verify:grid tool's masked output identical at both trees. The known UI failures are identical at both:
    row-controls 3 entries, toolbar-fits 1152, layout-fits D ×8. J is recorded.
- **On failure:** the pin waits. A fix is a new UI commit on claude/v200-ui with its own review, then re-merge (step 5) and
  re-check. Renderer OOM: re-run that tool alone (as on 13 Oct) and record both attempts.
- **Then:** update the ledger UI-C1 row ("integrated in `<merge sha>`; acceptance repeated at `$I7`: PASS, evidence/ui/c1-check-$I7").
  This is a records change under `recovery/` only, so it is allowed after the pin.

### Step 5: the integration branch

- **Name:** `claude/v200-integration` (local; pushed only on Brad's go, step 11).
- **Base:** `1c94537` (`$BASE0`). It is the reset base, so both branches descend from it, and it contains main `f9b4413`.
- **Order, both `--no-ff`, every commit kept:**
  1. `claude/v200-fixes-wip`: the **safety** line, `git rev-list $BASE0..claude/v200-fixes-wip`, 177 commits now. Product
     commits: 9b27e80 (Correction A), 3aeda74 R1, 529e07e R2, 4cb1e65, d4a241a R3, a0a9a6f R4/R4b, 8f22668 R5, 7e0764d,
     af892cb, 4a6f7c7, 4e90af4 + a8891e1 U2, 63bd8b0 U13, 0b4144a U1, d66dd60 U14, ef1548c U20, d701888 U30, b9e9837 U34,
     8b39373 U36, 867fd4a U41, 1a6a66e U42, e219a68 U3, 16ceb83 U4, U10 ×12, and tonight's. The rest are "(records
     only)".
  2. `claude/v200-ui`: the **UI** line, `git rev-list $UIB..claude/v200-ui`, 40 commits: chunks 1-3, M1, S1-S5 and UI-C1
     `7df816c`.
- **Preconditions:**
  - The safety tip is final and pushed: step 1 done, step 3 passed.
  - G10's UI entry is committed on the safety branch.
- **Commands:**

```sh
# trial first (text only, as I did at 254f29c): base 4a6f7c7, ours = the safety tip, theirs = 7df816c
W=$(git -C $R rev-parse claude/v200-fixes-wip); TT=$FG/work/mergetrial-${W:0:7}; mkdir -p $TT
for f in prioritization-board-grid.html tools/export-audit/mutate.mjs; do n=$(basename $f); git -C $R show $UIB:$f > $TT/$n.base; git -C $R show $W:$f > $TT/$n.m; git -C $R show 7df816c:$f > $TT/$n.t; git merge-file -q $TT/$n.m $TT/$n.base $TT/$n.t; echo "$n conflicts $?"; done
python3 -I $SP/rec/bin/mcount.py $TT/mutate.mjs.m $TT/prioritization-board-grid.html.m        # every entry once
# the real merges, in a worktree (orbit-board's own checkout never leaves claude/v200-fixes-wip)
WT=$FG/int-wt; $G -C $R worktree add -q -b claude/v200-integration $WT $BASE0
$G -C $WT merge -q --no-ff -F <(printf 'v2.00 integration (1 of 2): the safety branch claude/v200-fixes-wip at %s, every commit kept\n\nR1-R5, U1-U4, U10, U13, U14, U20, U30, U34, U36, U41, U42 and the fixes committed on 18 Oct, with the recovery records.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01MqCBDiYHPZfnyapxhXKxBm\n' "${W:0:7}") claude/v200-fixes-wip
$G -C $WT merge -q --no-ff -F <(printf 'v2.00 integration (2 of 2): the UI branch claude/v200-ui at 7df816c, every commit kept\n\nUI chunks 1-3 (M1, S1-S5) and UI-C1; 40 commits.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01MqCBDiYHPZfnyapxhXKxBm\n') claude/v200-ui
ln -s /home/user/orbit-board/node_modules $WT/node_modules
(cd $WT && timeout -k 10 600 npm run check --silent | tail -1)      # 'all checks passed' (after 3b; 2.4-9.9 s measured)
git -C $WT diff --stat $W HEAD -- . ':(exclude)ui-concept' | tail -3   # only the UI side's board, tools/*, package.json
```

- **NEXT-VERSION.md and the ledger end up consistent:**
  - NEXT-VERSION.md comes only from the safety side; the UI side never changes it, so it cannot conflict.
  - Each fix commit carries its own entry (inserted before `- **Unresolved after R1-R5 (11 Oct).**`, in commit order) and
    replaces its Unresolved line.
  - The ledger rows get their COMMITTED shas in records commits after each check.
  - Before the pin, check (shell, text only):

```sh
L=$WT/recovery/v200/UNRESOLVED-LEDGER.md
for s in $(grep -o -E 'COMMITTED as `[0-9a-f]{7,40}`' $L | grep -o -E '[0-9a-f]{7,40}' | sort -u); do git -C $R merge-base --is-ancestor $s claude/v200-integration || echo "LEDGER SHA NOT IN INTEGRATION: $s"; done
grep -o -E '^\| U[0-9]+ \|' $L | sort | uniq -d                       # no duplicate row
grep -o -E '^\| U[0-9]+ \|' $L | grep -o -E '[0-9]+' | sort -n | awk 'NR>1 && $1!=p+1{print "GAP after U"p} {p=$1}'
for u in $(git -C $R log --format=%s $BASE0..claude/v200-integration | grep -v -i -E 'records|no product change|evidence only|integration|recovery[:/]|ledger' | grep -o -E '\bU[0-9]+\b' | sort -u); do grep -q -E -- "^- \*\*$u[^0-9]" $WT/NEXT-VERSION.md || echo "NO NEXT-VERSION ENTRY: $u"; done
```

  - Every deferred row keeps "Open" with its limit, and its NEXT-VERSION Unresolved line stays.
  - When U37 and U40 land, the registry-text sub-list's "U37 (P1, a release blocker ...)" and "U40 ..." lines are replaced
    (INTEGRATION-NOTES 8).
- **Duration:** about 15-20 min (estimate: two merges, one npm check, text checks).
- **Evidence:**
  - the merge commits;
  - the trial outputs `$TT`;
  - the consistency check output, saved as `$FG/consistency-$I7.txt` and copied into the PIN record (step 6b).
- **Pass:** 0 conflicts; npm check `all checks passed`; mcount once; no line from the consistency checks.
- **On failure:**
  - A conflict: resolve add/add hunks as ours then theirs; anything else by hand, recorded in INTEGRATION-NOTES. Re-run
    mcount.
  - An npm check failure: STOP and find the cause. The fix is its own commit on the right branch, then re-merge.
  - Undo: `$G -C $R worktree remove --force $WT; git -C $R branch -D claude/v200-integration`.

### Step 6: bundle, restore verification, pin

- **Purpose:** the integrated branch exists only locally. Back it up so it provably restores, then pin the exact commit the
  queue will run.
- **How earlier bundles were made:**
  - `recovery/v200/bin/ui-bundle.sh` (blob `8b24d686`) for claude/v200-ui: bundle `4a6f7c7..branch`, then a fresh
    clone of claude/v200-fixes-wip from GitHub, then `bundle verify`, fetch, and tip, tree and rev-list compared.
    Bundle and MANIFEST are committed in `recovery/v200/ui-backup/`.
  - `rec/L8/pending-v200-fixes-*.bundle`, restore-tested in `rec/L8/bundle-restore-test{,2}`.
  - `ui-bundle.sh` would work on this branch, because orbit-ui is a worktree of the same repository. But it writes
    "(12 Oct 2026)" into the manifest and says "UI branch backup", so use the explicit form below.
- **6a. Commands:**

```sh
I=$(git -C $R rev-parse claude/v200-integration); I7=${I:0:7}; W=$(git -C $R rev-parse origin/claude/v200-fixes-wip)
BD=$FG/bundle-$I7; mkdir -p $BD; BF=$BD/claude-v200-integration-$I7.bundle
git -C $R bundle create $BF $W..claude/v200-integration; echo "create exit $?"
timeout 600 git clone -q --branch claude/v200-fixes-wip --single-branch $ORIGIN $BD/restore; echo "clone exit $?"
git -C $BD/restore cat-file -e $W^{commit} && git -C $BD/restore bundle verify $BF > $BD/verify.log 2>&1; echo "verify exit $?"
git -C $BD/restore fetch -q $BF claude/v200-integration:refs/heads/restored; echo "fetch exit $?"
[ "$(git -C $BD/restore rev-parse restored)" = "$I" ] && [ "$(git -C $BD/restore rev-parse restored^{tree})" = "$(git -C $R rev-parse $I^{tree})" ] \
  && diff <(git -C $R rev-list $BASE0..$I) <(git -C $BD/restore rev-list $BASE0..restored) && echo RESTORE-VERIFIED
mkdir -p $R/recovery/v200/integration-backup && cp $BF $R/recovery/v200/integration-backup/
{ echo "# claude/v200-integration backup, made $(et), 18 Oct 2026"; echo "tip: $I"; echo "tree: $(git -C $R rev-parse $I^{tree})"
  echo "prerequisite (on origin claude/v200-fixes-wip): $W"; echo "bundle sha256 $(sha256sum $BF | cut -c1-64) bytes $(stat -c%s $BF)"
  echo "restore check: fresh clone from $ORIGIN, bundle verify OK, fetched tip/tree equal, rev-list $BASE0..tip identical ($(git -C $R rev-list --count $BASE0..$I) commits)"
  echo "restore with: git clone -b claude/v200-fixes-wip $ORIGIN r && cd r && git fetch recovery/v200/integration-backup/$(basename $BF) claude/v200-integration:claude/v200-integration"
  echo; echo "safety line:"; git -C $R log --format='%h %s' $BASE0..$I^1^2 | head -400; echo; echo "UI line:"; git -C $R log --format='%h %s' $UIB..7df816c; } > $R/recovery/v200/integration-backup/claude-v200-integration-$I7.MANIFEST.txt
records integration-backup "recovery/v200: integration branch claude/v200-integration at $I7 bundled, restore verified (no product change)"
rm -rf $BD/restore
```

- **6b. Pin:**

```sh
P=$I; P7=$I7; PD=$FG/pin-$P7; mkdir -p $PD
git clone -q $R $PD/clone && git -C $PD/clone checkout -q --detach $P && ln -s /home/user/orbit-board/node_modules $PD/clone/node_modules
[ -z "$(git -C $PD/clone status --porcelain --untracked-files=no)" ] && [ "$(git -C $PD/clone rev-parse HEAD)" = $P ] && echo CLONE-OK
QO=$FG/final-$P7; snap $QO                                            # the queue's outdir: ONLY runner/ in it until launch
python3 -I -B $QO/runner/recovery/v200/bin/mkmanifest.py $PD/clone/tools/export-audit/mutate.mjs $PD/clone/prioritization-board-grid.html > $PD/manifest.tsv
[ ! -e $PD/affected.txt ]                                             # the queue would pass it to mkmanifest and the cmp would fail
python3 -I -B $QO/runner/recovery/v200/bin/mcount.py $PD/clone/tools/export-audit/mutate.mjs $PD/clone/prioritization-board-grid.html > $PD/mcount.json
[ "$(find $QO -mindepth 1 | grep -v -c '^'$QO'/runner')" = 0 ] && echo SNAPSHOT-UNTOUCHED   # -B: no __pycache__ attempt in the frozen snapshot
awk -F'\t' 'NR>1{print $4" | "$3}' $PD/manifest.tsv | sort | uniq -c > $PD/manifest-counts.txt   # expect '?' and mis-held rows (G1)
cp $PD/manifest.tsv $R/recovery/v200/manifests/mutation-manifest-$P7.tsv
{ echo "# v2.00 final tree, pinned $(et), 18 Oct 2026"; echo "pin: $P (claude/v200-integration)"; echo "tree: $(git -C $R rev-parse $P^{tree})"
  echo "parents: $(git -C $R log -1 --format=%P $P)"; git -C $R ls-tree -r $P prioritization-board-grid.html package.json tools
  echo; echo "mcount: $(cat $PD/mcount.json)"; echo "manifest: mutation-manifest-$P7.tsv"; cat $PD/manifest-counts.txt
  echo "bundle: integration-backup/claude-v200-integration-$P7.bundle"; echo "runner: $RS"; cat $FG/consistency-$P7.txt 2>/dev/null; } > $R/recovery/v200/manifests/PIN-$P7.md
records manifests "v2.00 recovery: the final tree pinned at $P7, its mutation manifest and blobs (records only)"
```

- **Concurrency:** 6a is git only and runs beside step 4. 6b comes after step 4 passes.
- **Duration:** 6a 10-20 min (estimate: a GitHub clone of the branch, now 66.6 MB of recovery plus history, and a 21+ MB
  bundle, the size of the UI one, plus a push). 6b about 10-15 min (estimate).
- **Pass:** all exits 0; RESTORE-VERIFIED; CLONE-OK; mcount every entry once; both records pushed.
- **On failure:** never delete the local branch or the clone. Re-run 6a. A clone failure from GitHub falls back to a
  local clone, but say so in the MANIFEST, as ui-bundle.sh does.

### Step 7: the final-tree queue, ONCE, from runner 2bfb590

- **Purpose:** the pinned baseline (every suite, audit-import alone) and the sensitivity of the categorized v2.00
  mutations, with provenance: a frozen snapshot, blob checks, the gate on `verdicts.tsv`, and backups to the branch.
- **Manifest for the current mutation set:**
  - The queue regenerates the manifest with the snapshot's `mkmanifest.py` on the clone and refuses unless it equals
    `$PD/manifest.tsv` (final-tree-v5.sh lines 153-156). Step 6b made it with the same script on the same clone.
  - The old `manifests/mutation-manifest-a8891e1.tsv` (170 ids) is stale.
  - Counts (Appendix A):
    - On the branch now (`96877da`): **305 v2.00 manifest rows** (303 `v200-*` plus two re-anchored legacy ids), 1,442
      entries in all, every one matching once. **114 are new since `7ee498a`.**
    - With U10 (`254f29c`): 367 rows, **176 new since `7ee498a`**, 1,504 entries.
    - The trial integration with the UI (254f29c + 7df816c): 1,541 entries, 404 rows: new 58, reimpl 35, held 188
      (135 + 53 mis-held), `?` 123.
- **Preconditions:**
  - The pin is recorded.
  - `$LOCK` absent; `quietnow` empty; `/.git` absent.
  - orbit-board on claude/v200-fixes-wip, clean index, equal to origin.
  - No agent running; the routine changed (G21); disk at least 2 GB free.
- **Launch:**

```sh
[ ! -e $LOCK ] && [ ! -e /.git ] && [ -z "$(quietnow)" ] && [ "$(git -C $R symbolic-ref --short HEAD)" = claude/v200-fixes-wip ] \
 && [ -z "$(git -C $R status --porcelain --untracked-files=no)" ] && [ "$(git -C $R rev-parse HEAD)" = "$(git ls-remote $ORIGIN refs/heads/claude/v200-fixes-wip | cut -f1)" ] \
 && [ "$(ls -A $QO)" = runner ] && echo PREFLIGHT-OK
unset FIRSTFAIL RUNNER_LOCK RUNNER_SHA SNAP SNAPROOT RUNNER_PIDS RUNNER_REFUSALS
setsid -f $QO/runner/recovery/v200/bin/final-tree-v5.sh $RS $PD/clone $QO final-$P7 $P $PD/manifest.tsv > $FG/final-$P7.driver.out 2>&1 < /dev/null
sleep 20; head -5 $QO/summary.txt                                    # "runner ... verified", "invocation", "start ... pinned tree"
```

  The driver output goes **beside** `$QO`, never in it: the queue refuses an outdir that holds anything but `runner/`.
- **Watching (keepalive):**
  - A tracked background waiter (Bash `run_in_background`, timeout 7,200,000 ms), re-armed each time it ends:
    `until grep -qE '^(DONE|STOPPED)' $QO/summary.txt 2>/dev/null; do sleep 120; done; tail -5 $QO/summary.txt`.
  - At each hourly firing: `tail -3 $QO/summary.txt; ls $QO/sens; uptime; df -h /; cat $QO/REFUSALS.txt 2>/dev/null`.
- **What it runs:**
  - 0: npm run check. Mandatory: a failure is exit 5.
  - 1: audit-import BASELINE alone. Then lanes L1 (audit-board, audit-hostile, audit-ppt, legacy-fsrc, boot-same) and
    L2 (audit-recon, audit-inject, audit-other, audit, audit-ui), each 600 s. Then verify:grid (exit-only gate), standards,
    and applicability (mcount).
  - 2: sensitivity for new, then affected, then reimpl; within each, audit-import (alone-run, full runs), audit-recon,
    audit-board and audit-ui (sens.sh, full suite per mutant). Only through gate.sh on each suite's baseline.
  - 3: held, not run (the 135, the informational lane).
  - At the pin that is **93 ids**: new 5 import + 16 recon + 37 ui; reimpl 14 import + 18 recon + 3 board.
- **Duration** (Appendix B; per-run times measured, totals estimated):
  - baseline about 27-38 min;
  - new-import 5 × 10.5-14.5 min; new-recon 16 × 5-8 min; new-ui 37 × 3.7-5.6 min; reimpl-import 14 × 10.5-14.5 min;
    reimpl-recon 18 × 5-8 min; reimpl-board 3 × about 3 min;
  - **total 9.0-13.4 h, central about 11.4 h.**
- **Outputs:**
  - `$QO/summary.txt` (and `suites/summary-all.txt`), `suites/*.log` + `.exit`, `import/`, and `sens/<cat>-<suite>/`
    (logs, mut-*.diff/json, summary.txt), `REFUSALS.txt`, `pids.txt`.
  - **Backup is automatic.** backup-run.sh makes records-only commits (`git commit --only` of
    `recovery/v200/evidence/final-$P7/...`) and pushes after each stage: `suites`, `import`, `sens-<cat>-<suite>`.
- **Pass:**
  - DONE with no "FAILED backup";
  - check ACCEPT; baseline audit-import ACCEPT; every lane suite ACCEPT; standards ACCEPT;
  - verify:grid recorded; it is expected REFUSE at the chain's row-controls (G4) and is judged in step 8;
  - applicability: every entry once;
  - every sensitivity id has exit 1 with a `FAILING CHECK(S)` line and no TIMED OUT;
  - no NOT APPLICABLE; no INCOMPLETE.
- **On failure** (never edit anything in `$QO`; record each event in RUNNING-CHECKS):
  - npm check fails (exit 5): stop. Fix on the right branch as its own commit, then re-integrate, re-pin, new outdir.
  - Baseline import not alone (exit 4): OVERLAP.txt names the process. Stop its owner and relaunch into a NEW outdir. The
    stopped run is recorded INCOMPLETE. "Once" means one complete run on the pin.
  - A suite baseline REFUSED (timeout or failure): its ids are INCOMPLETE, and the queue goes on. Diagnose after DONE, and
    re-run that suite's ids in a `qok` lane (step 10a form), labelled.
  - A survivor (ALL CHECKS PASSED on a mutant): a test gap at the final tree. The PR waits for a fix commit with its own
    check, or Brad accepts a named limit.
  - A signal or container restart: STOPPED/INCOMPLETE. A new outdir, and tell Brad (G18).

### Step 8: verify:grid in both font lanes (Brad's U28 decision, 13 Oct about 8:30 PM ET)

- **What "both font lanes" requires** (ledger U28 decision; `rec/L6/u28/README.md` Draft 1, "Open for Brad" (1) and (2)):
  - **Lane S:** the container as it is, with 'Segoe UI' → Inter. The substituted lane's failures stay on the record.
  - **Lane B:** only the alias left out (`FONTCONFIG_FILE` from `fc-nosegoe.sh`), every tool run through `fc-gate.sh`,
    which refuses unless `font-env.mjs` sees Arial's widths at 400-900. Every checker and `tools/font-standin.mjs` stay
    unchanged.
  - **Plus the +6% stand-in pass:** `fc-gate.sh <dir> -- node tools/layout-fits.mjs --board <template>`.
  - Native Windows acceptance is listed as pending.
  - "Before adopting the method, run all 14 tools both ways and compare." Since the chain stops at row-controls (G4),
    **each tool runs on its own** in both lanes, plus the chain once per lane.
- **Preconditions:**
  - The pin is set; G5 scripts are committed; nothing else runs Chromium.
  - The queue is in a recon, ui or board phase (`qok`), or DONE.
  - Lane S comes from step 4's per-tool runs at the after tree, which **is** the pin. If the pin differs from step 4's
    after tree, run lane S here too (same loop without fc-gate).
- **Commands:**

```sh
QO=$FG/final-$P7; X=$FG/grid-$P7; snap $X && renv $X; mkdir -p $X/S $X/B
qok(){ while :; do [ -e $LOCK ] && { sleep 20; continue; }; l=$(tail -n 1 $QO/summary.txt 2>/dev/null)
  case "$l" in DONE*|STOPPED*) return 0;; esac; echo "$l" | grep -qE '^sensitivity (new|affected|reimpl) audit-(recon|board|ui) \(' && return 0; sleep 20; done; }
E=$R/recovery/v200/evidence/L6-u28; F=$FG/fc-$P7; bash $E/fc-nosegoe.sh $F           # writes $F/fonts.conf; $F must be new
TOOLS="chrome controls inspector toolbar editors colours menus panels frames hostile layout keys dropdowns dialogs"
cd $PD/clone
for t in $TOOLS; do qok; $B/run.sh $X/B/$t.log 900 X=1 -- bash $E/fc-gate.sh $F -- npm run $t --silent; done
qok; $B/run.sh $X/B/verify-grid-chain.log 1800 X=1 -- bash $E/fc-gate.sh $F -- npm run verify:grid --silent
qok; $B/run.sh $X/B/standin-make.log 120 X=1 -- node $E/standin-template.mjs prioritization-board-grid.html $X/B/board-standin6.html
qok; $B/run.sh $X/B/layout-standin6.log 900 X=1 -- bash $E/fc-gate.sh $F -- node tools/layout-fits.mjs --board $X/B/board-standin6.html
for f in $E/*; do echo "$(basename $f) $(git hash-object $f)"; done > $X/lane-scripts-blobs.txt
txtcopy $X $R/recovery/v200/evidence/final-$P7/verify-grid-lanes   # boards excluded (sha256 listed); runner/ dir: delete it from the copy before commit
```

- **Concurrency:** `qok` lets a run start only while the queue is in a recon, ui or board phase, or has ended. At most one
  Chromium run. Never beside an audit-import run.
- **Duration:**
  - Lane S per tool: 16.9 min measured (S1-S5 review lane G at dd15956, 00:28:11-00:45:04 ET).
  - Lane B: estimate 20-25 min (the same tools plus 14 font-env checks; layout-fits whole 450.1 s in q50c-r2).
  - Chain: lane S stops at row-controls in 8 s; lane B the same, plus font-env.
  - +6% stand-in pass: 371.4 s (q52c, 13 Oct).
  - **Step 8 about 30-35 min**, plus lane S if it is needed here (17 min).
- **Pass** (recorded against what is known, not gated, since the method is being adopted):
  - fc-gate never REFUSES.
  - Lane B differs from lane S only by the font: J's U28 failures, if any appear in lane S, are gone.
  - The UI failures (row-controls, toolbar-fits 1152, layout-fits D ×8) are identical in both lanes, until Brad's G4
    calls change them.
  - The +6% pass shows only known FAILs. Fewer FAILs are not good news: check the template first (U28 Draft 1 (2)).
    Its overrun is measured and stated.
  - Every run has an `.exit` record.
- **On failure:**
  - fc-gate REFUSED (exit 3): the setting is wrong. Re-run fc-nosegoe into a new dir. Never edit `/etc`.
  - A browser lost to OOM: re-run that tool alone, recording both attempts.
  - A new FAIL in lane B: a real layout finding. It goes to Brad with its screenshot; the PR waits for his call.

### Step 9: the evidence matrix

- **What it is:** the one table Brad asked for (12 Oct 6:59 AM; IMMINENT-CHANGES "Recommendation" 4). It holds what is
  fresh at the pinned tree, justified reuse with its reason, what is incomplete, and the remaining findings. Raw logs sit
  beside it (12 Oct 6:05 PM: "the status summary alone doesn't establish independent verification"), and every deferred
  row has its limit named (also in NEXT-VERSION.md "Not covered").
- **File:** `recovery/v200/evidence/final-$P7/MATRIX.md`, written by the lead or one text agent. Text only; no runs.
- **Layout:**
  - **A. Identity:** pin, tree and blobs (PIN-$P7.md); runner `2bfb590` and the queue's "snapshot verified" line; the
    safety and UI commit lists; the bundle.
  - **B. Baseline at the pin:** one row per run (check, audit-import, the 10 lane suites, verify:grid lane S and lane B
    per tool and the +6% pass, standards, applicability, the gate's stages from 10b). Columns: command, start ET, exit,
    duration, last line, gate result, log path on the branch.
  - **C. By ledger row:** U1-U57 (+ any new), R1-R5, R4b, item 99, UI-M1, UI-S1-S5, UI-C1. Columns: status (fixed in
    `<sha>` / deferred / open), fail-before evidence (`evidence/cc/<sha7>`, or earlier `evidence/L2-*`, `L3-*`), its
    mutations (n; lane; caught n/n; survived; incomplete), reuse (what, the identity shown, and the scope), limits / Not
    covered.
  - **D. Mutation coverage:** every v2.00 id exactly once, with its group, its lane (queue new/reimpl, presweep, 135
    lane) and its result. The ids the queue's manifest filed `?` or held. NOT APPLICABLE ones. The 1,139 pre-v2.00
    entries named as **not swept at this tree** (G3) unless decided otherwise.
  - **E. The four columns:** fresh at the pin / justified reuse (with reason) / incomplete / remaining findings.
  - **F. Raw logs:**
    - `evidence/triage-63bd8b0/` (u17, u17-check for U17 and U29; u20, u20-check for U20 and U30; u24, u24-check for U24
      and U31; MANIFEST.sha256 checked).
    - **U32-U36:** `evidence/U32-U36/cycreg/` (from `rec/L6/cycreg/{logs,out,codex-b2,probe}`; the import reproduction
      and XLSX read from its bytes), `.../yearsel/` (U34), `.../regtext/` (U36).
    - **U35:** Codex A1 on branch `codex/v200-reports-20261013` (`f7d1aea`), `codex-reports/A1/`.
    - `evidence/cc/<sha7>/` for every commit check.
    - `evidence/ui/c1-check-$P7/`.
    - `evidence/final-$P7/` (queue, lanes, presweep, gate, 135).
  - **G. Deferred, with limits:**
    - U5-U8, U11, U12, U15, U16, U21-U23, U25-U27, U35, U38, U39, U45, U47, U48, U51-U55;
    - U28 (and c1 if not landed);
    - U46 only if U37 does not close it;
    - every non-blocker not clean at 8 PM: U9/U43, U9L, U18, U24/U29/U31 with U17, U19, U19H, U56/U57;
    - UI-m1-m7 and the three verify:grid UI items;
    - NEXT-VERSION "Open" items 63, 71, 82, 84, 89, 100, 101.
  - **H. Process:** overlaps, OOM kills, retries, timeouts, the stale manifest map (G1), and any time corrected.
- **Inputs:**
  - `$QO`, `$FG/{grid,presweep,gate,lane135}-$P7`;
  - `$SP/rec/L8/cc/*`; `$SP/rec/L6/*/README.md` and `drafts/`;
  - the ledger; NEXT-VERSION.md; `$SP/uichunk3/c1-check-$P7`;
  - `recovery/v200/evidence/*` on the branch.
- **When:** sections A, C, F and G during W1 (text only). B, D and E as results land. Final after DONE and the lanes.
- **Duration:** 1.5-2.5 h of writing (estimate), mostly inside the queue.
- **Backup:** `records evidence/final-$P7 "v2.00 recovery: the final-tree evidence matrix at $P7 (records only)"`, made
  when no backup-run is in flight.
- **Pass:**
  - every row has a status and a source path that resolves on the branch;
  - every v2.00 id appears once;
  - every deferred row states its limit;
  - nothing says "passed" without a log.

### Step 10: the presweep, the full gate and the 135-mutation lane

These run in `qok` windows (W1, W2) or after DONE. `qok`, `snap` and `renv` are as in step 8. Each lane gets its own outdir
under `$FG`.

**10a. Presweep.** Definition (proposed; G13), from the repository's sense (`AGENTS.md`: "a presweep of your new mutations")
in text-only form:
- **Scope:** every v2.00 id the queue does not run: suite `?` or mis-held in `$PD/manifest.tsv`, from the 7ee498a+ tracks.
- **Method:**
  - Each mutant is made from the **pinned** clone's mutate.mjs as text (`mkmut.py`) and run against the focused harness of
    its own block.
  - The harness is built verbatim from the **pinned** suite file with the track's harness builder: `rec/L3/u14/mkfocused.py`
    + `runner.mjs` for audit-recon blocks; `rec/L2/u2impl/mkfocused-u2.py` for audit-import blocks; or the builder named
    in `rec/L6/<track>/README.md`. This is exactly what the commit checks did.
  - Control: the harness passes on the pinned board.
  - Caught = exit 1 with a failing check of that block.
  - An id not caught goes to `sens-chain.sh`. If still not caught, to its suite whole, alone if it is audit-import or
    audit-board, after DONE.
- **Ids:** `awk -F'\t' 'NR>1 && ($3=="?" || ($4=="held" && $1 ~ /^v200-(regtext|yearsel|cycreg|adopt|u9l|u19h)-/))' $PD/manifest.tsv`.
- **Tool to write (G13):** `$FG/presweep.js`, a copy of `rec/L8/commit-check.js`'s pattern.
  - One agent per track group, at most 2 at a time, each with 1 process.
  - Its RULES add: "before EVERY node run, also wait until `qok` would return (the last line of `$QO/summary.txt` is a
    `sensitivity … audit-(recon|board|ui) (` line, or DONE/STOPPED)".
  - Each agent writes `$FG/presweep-$P7/<track>/summary.tsv` (id, harness blob, exit, failing checks, seconds, mutant
    blob) and deletes each mutant board after its line is written.
- **Duration:**
  - Focused mutant runs in the commit checks averaged 16.9 s (U41), 27.4 s (U4), 65.2 s (U10 c3), 120.7 s (U34) and
    176.5 s (U3), under load (`rec/L8/cc/*/logs/M-*`).
  - Estimate 30-90 s per id at night → about 430-575 ids (blockers in; non-blockers as landed) ≈ **1.8-7 h over two
    lanes, central about 4 h**, plus harness builds of about 20-40 min.
  - W1 is about 4.6 h.
- **Backup:** `txtcopy $FG/presweep-$P7 $R/recovery/v200/evidence/final-$P7/presweep && records evidence/final-$P7/presweep "..."`.
- **Pass:** every id caught by its block; the control passes; no timeout.
- **On failure:**
  - A survivor goes to the chain, then the whole suite. Still surviving: a real test gap, so R9.
  - A control failing: the harness was built wrong (rebuild) or a real failure (STOP, step 7 failure handling).

**10b. The full gate (proposed text-only form; G3 decision).** The stages of `tools/validate-math.mjs`, run one at a time
on the pinned clone, bounded and logged. Pass lines come from validate-math.mjs:

```sh
X=$FG/gate-$P7; snap $X && renv $X; cd $PD/clone; BD=$PD/clone/prioritization-board-grid.html
qok; $B/run.sh $X/0-defects.log    600 X=1      -- node tools/math-defects.mjs                 # exit 0; "N known defect(s) ... guarded by M mutation(s)"
qok; $B/run.sh $X/1-coverage.log   600 BOARD=$BD -- node tools/money-coverage.mjs              # exit 0; "holds — x/y"
qok; $B/run.sh $X/1b-money-map.log 600 X=1      -- node tools/money-map.mjs --check            # exit 0; "money map holds" (AGENTS.md)
qok; $B/run.sh $X/2-trace.log      600 BOARD=$BD -- node tools/trace-matrix.mjs                # exit 0; "N populated cells"
qok; $B/run.sh $X/5b-fuzz.log     1200 BOARD=$BD -- node tools/roundtrip-fuzz.mjs              # exit 0; quote the seed
qok; $B/run.sh $X/5c-verify-file.log 600 X=1    -- node tools/verify-file.mjs --selftest       # exit 0; "VERIFIER SELF-TEST PASSED"
```

- **Stage 3** (the suites) and **stage 5** (browser checks) are the queue's baseline and step 8 at the same pin, the same
  commands, fresh. They are not repeated.
- **Stage 6** (`node tools/export-audit/mutate.mjs`) is **not run** under the standing rule. It is stood in for, for the
  v2.00 entries, by the queue's sensitivity + 10a + 10c.
- **The 1,139 pre-v2.00 entries** (v1.99's swept set, PR #10) are not swept at this tree. They are a named limit unless
  Brad decides G3 otherwise. If he authorizes the real gate: `cd $PD/clone && npm run validate:math` alone, after DONE,
  about 9-15 h (v1.99: 9 h 49 min for 1,139).
- `math-defects.mjs` and `money-coverage.mjs` read mutate.mjs as text (`readFileSync`). They do not run it.
- **Duration:** estimate 20-40 min for the six stages. No individual measurement is on record; v1.99's whole gate, 9 h
  49 min, was almost all sweep.
- **Backup:** `txtcopy $X ...final-$P7/gate`, then `records`.
- **Pass:** each stage exits 0 with its pass line. Stage 5 is clean only after G4.
- **On failure:** a stage failing is a release finding. It names itself (validate-math.mjs "report"). It goes to the
  matrix, and the PR waits for Brad.

**10c. The 135-mutation lane** (RUNNING-CHECKS 12 Oct 6:53 AM ET). These are the 135 pre-reset v2.00 hardening mutations
(item 99), their ids listed in `$FG/work/held-7ee.txt`. They are the held set at `7ee498a`, all applying once at `96877da`,
at `254f29c` and in the trial merge.
- First catch, cheap suites first: `sens-chain.sh`, in the order audit-inject, audit-hostile, audit-other, audit,
  audit-ppt, audit-recon, audit-board, each with `MUT_FIRST_FAIL=1`.
- Only a mutant none of them catches gets audit-import, **alone**, after DONE (alone-run, `FIRSTFAIL=1`).
- `sens-chain.sh` neither checks the lock nor survives a per-id call's truncation of `needs-import.txt`, so it runs one id
  per outdir, behind `qok`:

```sh
X=$FG/lane135-$P7; snap $X && renv $X; mkdir -p $X/chain
for id in $(cat $FG/work/held-7ee.txt); do qok; $B/sens-chain.sh $PD/clone $X/chain/$id $id; done      # cwd any; it cds into the clone
cat $X/chain/*/summary.txt > $X/chain-summary.txt; grep -h 'full audit-import alone' $X/chain-summary.txt | cut -d' ' -f1 > $X/needs-import.txt
# after the queue's DONE only (alone):
FIRSTFAIL=1 $B/alone-run.sh $PD/clone $X/import final-$P7/lane135-import "135 lane: audit-import fallback (first fail)" $(cat $X/needs-import.txt)
txtcopy $X/chain $R/recovery/v200/evidence/final-$P7/lane135-chain && records evidence/final-$P7/lane135-chain "v2.00 recovery: the 135-mutation lane's first-catch chain at $P7 (records only)"   # one commit, not 135 pushes
```

- **Duration:**
  - Sample: 6 ids in 313 s (`rec/L3/chain-sample/`, 12 Oct 6:47-6:52 AM ET). 5 were caught by audit-inject in 6-16 s
    each; `v200-door-dest-open` passed all seven cheaper suites in about 260 s and needs audit-import.
  - Estimate: the chain for 135 takes about 30-100 min, plus n × (30 s quiet + 10-14 min) alone fallbacks. n ≥ 1 is
    unknown; the sample's 1-in-6 suggests up to about 23, which is up to about 5.5 h.
  - The 8 Oct gate's "last 50 took 76 minutes" (mutate.mjs comment) is the same pattern.
- **Pass:** every id caught, by the chain or the fallback; no NOT APPLICABLE; no timeout.
- **On failure:**
  - A fallback OVERLAPPED: repeated automatically.
  - A survivor after the fallback: a hardening guard nothing checks. It goes to Brad, and the PR waits.

### Step 11: the PR

- **Base:** `main` (`f9b4413`).
- **Head:** recommended `claude/orbit-v2.00`, fast-forwarded to the integration tip. `git merge-base --is-ancestor $BASE0
  claude/v200-integration` must hold. This follows PRs #2-#10 (`claude/orbit-vX.YY` → main). The alternative is a new
  `claude/orbit-v2.00-final` (G16).
- **Title** (house style, as PR #10):
  `v2.00 — the security version (item 99), R1–R5 and the 11–18 Oct review fixes: no copy of anyone's work lost, money exact in every export, and the new board layout (UI chunks 1–3)`
- **Body:** `$FG/PR-DRAFT.md`. There is no template at main (G15); its headings follow PR #10. Fill every `‹FILL: …›`
  marker into `$FG/PR-BODY.md`. Do not edit PR-DRAFT.md itself. Its last two lines stay exactly as written.
- **Before opening:**
  - If records were merged onto the integration branch after the pin (the matrix and evidence: `git -C $WT merge --no-ff
    claude/v200-fixes-wip`), prove the product is still the tested one:
    `git -C $R diff --stat $P claude/v200-integration -- . ':(exclude)recovery' ':(exclude)NEXT-VERSION.md'` must be
    empty.
  - Decide G11 (recovery/ in the release tree).
- **Commands** (on Brad's go only; per his schedule he pushes and merges):

```sh
git -C $R push origin claude/v200-integration:claude/orbit-v2.00          # Brad, or the lead on Brad's explicit word; a fast-forward
gh pr create --repo bradludington-ui/orbit-board --base main --head claude/orbit-v2.00 \
  --title "v2.00 — the security version (item 99), R1–R5 and the 11–18 Oct review fixes: no copy of anyone's work lost, money exact in every export, and the new board layout (UI chunks 1–3)" \
  --body-file $FG/PR-BODY.md
```

- **After:** Brad reviews and merges. Disable the hourly routine at the publish question: `update_trigger enabled=false`
  on `trig_01PhhHK97YTPeEsCZr3X2fvw`, per its own step 6.

---

## Appendix A: mutation counts, read as text from mutate.mjs (`mkmanifest.py` and `mcount.py` at `2bfb590`, `python3 -I`)

All entry counts are from mcount. Every entry matched exactly once in each tree below.

| Tree | Entries | v2.00 manifest rows (`v200-*`) | new · reimpl · held · `?` |
|---|---|---|---|
| `7ee498a` (product = `d66dd60`) | 1,328 | 191 (189) | 21 (U13 5 import; U1 + U14 16 recon) · 35 (14 import, 18 recon, 3 board) · 135 · 0 |
| `96877da` (branch tip now) | 1,442 | 305 (303) | 21 · 35 · 188 (135 + 53 mis-held) · 61 |
| `254f29c` (+ U10, staged) | 1,504 | 367 (365) | 21 · 35 · 188 · 123 |
| `7df816c` (UI branch) | 1,342 | 205 (203) | 37 audit-ui · 33 · 135 · 0 |
| trial merge `254f29c` + `7df816c` (base `4a6f7c7`; `$FG/work/mergetrial/`) | 1,541 | 404 (402) | 58 · 35 · 188 · 123 |

**New since `7ee498a`, by group:**

| Tree | Group (suite) | Count |
|---|---|---|
| `96877da` (114 in all) | U20 (import) | 2 |
| | U30 (import) | 12 |
| | U3 (import) | 10 |
| | U4 (import) | 12 |
| | U34 `v200-yearsel` (recon, mis-held) | 33 |
| | U36 `v200-regtext` (recon, mis-held) | 20 |
| | U41 (recon) | 20 |
| | U42 (recon) | 5 |
| `254f29c` (+62, 176 in all) | U10 (recon) | 62 |

Id lists are in `$FG/work/new-96877da.txt` and `$FG/work/new-u10.txt`. The per-tree manifests are
`$FG/work/<tree>/manifest.tsv` and `$FG/work/mergetrial/manifest-trial.tsv`.

**Late tracks**, counted on their newest copies (`rec/L6/<track>/…/mutate.mjs.txt`):

| Track | Group (suite) | Count | How the stale `mkmanifest.py` files it |
|---|---|---|---|
| Blocker | cycreg (recon) | 64 | held |
| Blocker | U37 (recon) | 71 | `?` |
| Blocker | U40 (import) | about 49 | `?` |
| Blocker | U44 (recon) | 72 | `?` |
| Non-blocker | U18 (import) | 26 | `?` |
| Non-blocker | adoption `v200-adopt` (import) | 33 | held |
| Non-blocker | U9 (recon) | 23 | `?` |
| Non-blocker | U43 (recon) | 3 | `?` |
| Non-blocker | U9L (recon) | 18 | held |
| Non-blocker | U19 (import) | 25 | `?` |
| Non-blocker | U19H (import) | 15 | held |
| Non-blocker | U41b | not yet built | |
| Non-blocker | U28 c1 | 0 (a comment only) | |

## Appendix B: timing samples used, with sources

| Run | Measured | Source |
|---|---|---|
| npm run check | 2.4-2.6 s; 7.5-9.9 s | RUNNING-CHECKS 12 Oct 7:14 AM; `uichunk3/c1-check-7df816c/README.md` §2 |
| audit-import whole, alone | 483.1 s, 550.7 s (baselines); 486.6-554.0 s (mutants); 534.1, 491.5 s | RUNNING-CHECKS "12:27 AM ET" table; "7:38 PM ET" (11 Oct) |
| audit-recon whole | 98.4 s (12 Oct smoke); 107.0 s; 151.7-177.9 s; 280.8 s; 301-473 s (load); 493.2 s; 497.6 s; **577.5 s OOM / 600.9 s timeout** (load) | `evidence/runner-0c189f0/smoke-592d629/logs/*.exit`; `rec/L8/cc/{ef1548c,867fd4a,1a6a66e,e219a68,7e30379,aec3e63,e96bcfe,482f64c,c82ea62,ef2792e}/logs`; `rec/L6/cycreg/README.md` (S-audit-recon-fr5); `rec/L6/u44/README.md` (head16) |
| audit-ui | 220.5 s (counted), 337.8 s | `uichunk3/c1-check-7df816c/README.md` §5 |
| audit-other / audit / inject / hostile / ppt / legacy / boot-same | 41.5-111.5 / 11.8-35.7 / 15.7-39.5 / 106.7-146.8 / 6.9-11.6 / 4.9-8.8 / 13.3-40.7 s | `rec/L8/cc/{ef1548c,e219a68}/logs`; smoke-592d629; c1-check §5 |
| audit-board | about 2.6-3 min | IMMINENT-CHANGES-RETESTS (11 Oct); codex-handoff-3 C1a table (no recent log found) |
| standards | 51.2 s | smoke-592d629 `standards.log.exit` |
| verify:grid | chain 361.1 s (base, 12 Oct); 7.7-8.3 s on the UI branch (stops at row-controls); 14 tools one by one 16.9 min | smoke-592d629; `evidence/ui/s1-s5-review/r2/README.md` lane G; CHUNK3.md |
| layout-fits whole (lane B, c1); +6% pass | 450.1 s; 371.4 s | `rec/L6/u28/README.md` q50c-r2, q52c |
| UI-C1 acceptance check (both trees) | 53 min | RUNNING-CHECKS 13 Oct 1:19 PM; c1-check README |
| Commit checks | 9-50 min per commit; about 25-35 min per pair under load | RESTART log (13 and 18 Oct) |
| Focused mutant runs (commit checks) | mean 16.9-176.5 s | `rec/L8/cc/*/logs/M-*` |
| 135-lane chain sample | 6 ids in 313 s; inject 6-16 s; uncaught chain about 260 s | RUNNING-CHECKS 12 Oct 6:53 AM; `rec/L3/chain-sample/` |
| Runner self-test | 38-48 s (42/42 at `2bfb590`, 5:05:29-5:06:08 PM) | RUNNING-CHECKS 12 Oct 5:06 PM |
| v1.99 full gate (validate:math) | 9 h 49 min, 1,128 + 11 equivalent | PR #10; CLAUDE.md line 3841 |
| U10 text agent (nv/ledger/msg) | 32 min | RESTART log 18 Oct 4:01-4:33 AM |

**How the queue estimate is built** (per-run times measured, scaling estimated):
- audit-import: 10.5-14.5 min per run, 483-551 s × suite length 9,131-11,700 / 7,491, plus the 30 s quiet.
- audit-recon: 5-8 min per run, at night alone, between 281 s and 498 s.
- audit-ui: 3.7-5.6 min per run.
- audit-board: about 3 min per run.
- Baseline lanes: max(L1 5-7, L2 13-19) min.

That gives 0.45-0.65 h of baseline and 8.6-12.7 h of sensitivity, about 9.0-13.4 h in all.

A runner with a full manifest and full runs (G1, option 2f) would add about 140-190 import ids × 13 min and about 420-500 recon
ids × 6.5 min, which is 25-50+ h.

## Appendix C: files

- This runbook: `$FG/RUNBOOK.md`. The PR body draft: `$FG/PR-DRAFT.md`.
- Inputs I produced (text only, under `$FG/work/`):
  - `held-7ee.txt` (the 135 ids);
  - `new-96877da.txt`, `new-u10.txt`;
  - `ids-*.txt`;
  - `<tree>/manifest.tsv`;
  - `mergetrial/manifest-trial.tsv`;
  - `t-<track>.ids`;
  - `ids.py`.
- The board and mutate text copies used for counting were deleted afterwards (disk).

**Added 19 Oct (Brad, AskUserQuestion asked 11:01 PM ET 18 Oct, answer read 5:23 AM ET 19 Oct):** U37: a literal _xHHHH_ is refused, with a named limit; decoding at import goes post-merge. Blockers still not clean after their last round (U37/U40: round 8; U44: round 8) ship their latest fix with the open must-fix as a named limit, only if that fix is no worse than today's board in every measured case; otherwise they are left out.
**Added 19 Oct (5:26 AM ET, Brad, AskUserQuestion):** U40 ships with the round-8 reviewer's words fix c18 + tests c17p; the plan/PB27 split on the owner-rename route (M1-CA), said by the board, is a named limit. U40 lands last, with F1's fix and the U44 tie-ins.
**Added 19 Oct (5:30 AM ET, Brad, AskUserQuestion; weekly usage at 80%):** LEAN GATE. No new agents. The builders' checks plus the lead's full-suite runs replace the per-commit check agents. The UI-C1 re-check agent and both G22 reviews are skipped, and the PR body names each skip.
**Added 19 Oct (7:24 AM ET, Brad, AskUserQuestion):** the 9 new standards findings from the UI branch: post the PR now with them named as open; fix them in the same PR before merge (re-run standards and verify:grid).
**Added 19 Oct (10:10 AM ET, Brad):** the left-menu restructure (rec/L7/RESTART-AFTER-RESET.md, 10:10 AM entry) is built in PR #13 with the 9 standards fixes; push to claude/orbit-v2.00 after its checks pass.
