# ORBIT: handoff for v2.02 (rewritten 20 Oct 2026, 6:45 PM ET, after v2.01 merged)

**From:** the lead on ORBIT v2.01 (Claude, session `session_01WAQdZVXseNKYbs2w2hGdHq`), for Brad and whoever picks up
v2.02: a new Claude session, Codex, or Brad.

**Where this file is:** `recovery/v202/HANDOFF.md` in `bradludington-ui/orbit-board`. An earlier draft was merged with
PR #14; this version replaces it and was written after the merge.

All times are Eastern unless marked UTC.

---

## 0. Read this first

1. **v2.01 is on `main`.** PR #14 was merged by Brad's go at 6:31 PM on 20 Oct. The merge commit is `c357911`, and its
   files are identical to the PR head `38df3b1`. `main` reads `BUILD='v2.01 (20 Oct 2026)'`. Every v2.02 branch starts
   from `main`.
2. **Check every PR's state before acting on it.** Run `pull_request_read get` and read `merged`. PR #13 (v2.00) was
   merged a minute after it was opened, and the lead after it worked for a day as if it were still open.
3. **Clone with full history.** If `git rev-parse --is-shallow-repository` says true, run `git fetch --unshallow origin`.
   Several checks rebuild boards from old commits (`68b02e9`, `7ee498a`). A shallow clone fails them for a reason that
   has nothing to do with the board.
4. **Read `CLAUDE.md` and `AGENTS.md` before anything else.** Standing rules live there now, not only in handoffs. Where
   this file disagrees with them, they win; tell Brad about the conflict.
5. **Anything kept only in a session's scratchpad is lost when the session ends.** That includes PDFs, evidence zips,
   sweep logs and Codex's diffs. Send each deliverable to Brad with `SendUserFile` as soon as it exists, and say so.
6. **The tracker is section 4.** Every open action is there, with an owner and the next step. Update it in the same
   commit that changes an item's state.

## 1. Where things stand (20 Oct, 6:45 PM)

| Thing | State |
|---|---|
| `main` | **v2.01**, merge commit `c357911` (PR #14). |
| PR #14 | Merged. The session is unsubscribed from it. |
| PR #13 (v2.00) | Merged 19 Oct at `b71b18e`. Everything left behind on `claude/orbit-v2.00` came in with #14. |
| `claude/orbit-v2.00` | `c6ba63f`, fully contained in `main`. Do not add to it. |
| `claude/v200-fixes-wip` | The v2.00 backup and records branch (`3fab8ef`): the Codex handoffs, `session-records/` (final-gate runbook, post-merge queue of 19 Oct). Read-only unless Brad says otherwise. **Its `UNRESOLVED-LEDGER.md` is OLDER than `main`'s**: `main` has UI-MENU and UI-508 and newer U37/U40/U44 text. Use `main`'s. |
| `ccr-24c317db-e0vz0v` | v2.01's working branch, restarted from `main` for this handoff. |
| Other branches | `claude/orbit-v1.91`…`v1.99`, `claude/orbit-ui-modernization`, `claude/security-review-kit`, `codex/agent-lanes-and-monitoring`, `codex/v200-reports-20261013`, `codex/v200-reports-round2-20261013`: history. Nothing is pending on them. |
| The v2.01 mutation sweep | **Not run, by rule.** Pilot only (20 targets, all caught; section 4, A1). The full sweep is v2.02's first item. |
| Last full checks | `validate:nightly` at `69a790c` (10:08–11:00 AM, 20 Oct): every stage clean except the 8 carried layout-fits D results. Fuzz seed 575709290. Money map: 123 proven, 206 n/a, 0 open. `verify:grid`, keys, dropdowns, dialogs, leftmenu, and standards (0 findings) at `62443fe`, the last change to the board. The board is unchanged since. |
| OCIO POA&M (WO59515) | The PDF was rebuilt 20 Oct ("not yet fully deployed"). The evidence package was built at `f616daa`, whose board and tests are identical to `main`. Both were delivered to Brad and are **not** in git (CUI). |
| `orbit-review-mcp` | Attached to the session, untouched in v2.01. `main` is at `acbeb7e` (10 Oct). Its README says the cloud deployment, the Worker build and client installation are still pending. Nothing is open on it for v2.02 unless Brad raises it. |

## 2. Access and permissions: what has to carry over

A new session does not inherit this one's access. Set up each item below before work starts. Items marked **Brad** can
only be done by Brad.

| # | Access | How the next session gets it | Check |
|---|---|---|---|
| P1 | **Repository `bradludington-ui/orbit-board`, push** | Start the session in the environment below with the repository attached; otherwise `add_repo` (owner `bradludington-ui`, repo `orbit-board`, access `push`). Use the current name: access is granted by NAME, and the old name `spmt-prioritization-board` is refused. | `git push --dry-run` on the working branch |
| P2 | **Repository `bradludington-ui/orbit-review-mcp`** | Attached the same way, if needed (it was attached to v2.01's session). | `git ls-remote` |
| P3 | **GitHub API (PRs, reviews, merges)** | The GitHub MCP tools (`mcp__github__*`, loaded with ToolSearch). `gh` is not available in these containers. If GitHub refuses: **Brad** reconnects at https://claude.ai/connect-github, or installs the Claude GitHub App on the repository. | `pull_request_read` on #14 returns `merged: true` |
| P4 | **Cloud environment** | "Sustainment Portfolio Management Tool" (`env_01TABfDTVRXVJvQvBaTXZ64y`). v2.01 ran there: Chromium at `/opt/pw-browsers`, Node, Python 3, about 15 GB of memory. Its network policy blocks WebFetch and curl to outside hosts; WebSearch works. | `ls /opt/pw-browsers`, `node -v` |
| P5 | **Permission mode** | v2.01 ran in **auto** mode with draft PRs created automatically. Use the same, or the session stalls on prompts during long runs. | — |
| P6 | **Routines (scheduled triggers)** | They belong to Brad's account, not to a session, so any session can list and update them (`list_triggers`, `update_trigger`). Their prompts name `orbit-board`. Their *attached* repository is still the pre-rename URL, which clones through GitHub's redirect; only **Brad**, in the Routine editor on claude.ai, can change it. | `list_triggers`; section 3 |
| P7 | **Codex** | Offline for Brad on 20 Oct. Codex reaches the repository through Brad's own setup, not through this session. When it is back, ask it to put diffs **inline** in its report. | Brad says it is back |
| P8 | **Files outside git** | `build_pdf.py` (OCIO PDF generator), `build_evidence.sh`, the POA&M PDF and the evidence zip are with **Brad**. A session that needs them asks him to upload them. | — |
| P9 | **Repository settings** (branch protection, required review, signed commits, secret scanning) | **Brad only**: the proxy refuses settings writes from a session. They are an OCIO milestone (section 4, C2). | — |

Connectors such as Gmail, Calendar and Drive are attached to Brad's account, not to ORBIT. ORBIT work uses none of them,
and the OCIO response does not mention AI tools.

## 3. Routines (as of 20 Oct, 6:40 PM)

| Routine | Schedule | State | What to know |
|---|---|---|---|
| Nightly ORBIT math validation (no sweep) — `trig_01MNk6Db7rBPGhnxChGUXkMu` | 07:00 UTC daily | enabled | Runs `npm run validate:nightly` on `main`. **Its first real run on v2.01 is 21 Oct, 07:00 UTC** (before that it stopped at "main predates v2.01"). Read that report first when you pick up. It reports the 8 layout-fits D results as the carried limit. |
| Nightly ORBIT data-loss fuzz — `trig_01RAstTxNdkTfJYrZrA2dJyv` | 09:00 UTC daily | enabled | 12 rounds of `npm run fuzz`. Last run 20 Oct succeeded. |
| Weekly ORBIT Interface Review — `trig_01DuixcCjkGaHDJw6JtTCK5o` | Mondays 08:00 UTC | enabled | Standards gate, census, shots, market scan. Next: 26 Oct. |
| v2.00 overnight check-in (hourly) — `trig_01PhhHK97YTPeEsCZr3X2fvw` | hourly | **disabled** | Obsolete (v2.00 release work). Brad may delete it; leave it disabled otherwise. |

Routines that are not ORBIT's (Brad's family calendar and "Around Town") are listed by `list_triggers` too. Leave them
alone.

## 4. Tracker: every open action

Owner: **C** = the Claude lead, **B** = Brad, **X** = Codex. "Ledger" means `recovery/v200/UNRESOLVED-LEDGER.md` on
`main`.

### A. Verification debt from v2.01 (first)

| # | Action | Owner | Blocked on | Next step |
|---|---|---|---|---|
| A1 | **Brad, 20 Oct: start after the Saturday 24 Oct reset, from a fresh session.** **Full sharded mutation sweep** of the ~895 targets added or rewritten in v2.00 and v2.01, then a full sweep of all 2,021 before the hosted rebuild (Brad, 20 Oct). | C | Brad's **named go** and his weekly usage reset (Saturday 24 Oct, night) | Fresh session. Calibrate once (`--calibrate-only`, about 18 min, 38 shards), then run in saved batches: `node tools/export-audit/sweep-shards.mjs --ids FILE --out DIR --jobs 4`. It is resumable (`results.jsonl`). Expect about 4 min per target, so about 60 hours for 895. Run one detached job with one watcher, and nothing else alongside. A SURVIVED target needs a new check, never a deleted mutation. Record the result in `NEXT-VERSION.md` under v2.01. |
| A2 | Read the nightly math run of 21 Oct (07:00 UTC), the first on v2.01. | C | — | If anything but the 8 D results fails, it is real: open it as an item. |
| A3 | **Done 20 Oct (v2.02 branch).** **Fill the `GATE_V200` placeholder** in `CLAUDE.md`'s v2.00 section (the line reads `**Gate.** GATE_V200`). | C | — | Fill it from the v2.00 gate record on `claude/v200-fixes-wip` (`session-records/FINAL-GATE-RUNBOOK.md`), stating plainly what ran and what did not (the lean gate’s skips, item E6). Never write a pass that was not observed. |
| A4 | **Done 20 Oct (v2.02 branch): settle wait built and proved, see `NEXT-VERSION.md` 101.** Item 101: `editors-reachable.mjs` measures 300 ms after the click instead of after layout settles (a 1px flake at 1400). | C | — | Wait for two animation frames and equal back-to-back readings. Prove it: the forced early reading fails, the settled one passes. Test tool only. |

### B. OCIO POA&M milestones

| # | Date | Milestone | Owner | Next step |
|---|---|---|---|---|
| C1 | 23 Oct | Interim pilot restrictions in effect | B | Brad confirms. Nothing in the repo. |
| C2 | 6 Nov | **Brad, 20 Oct: no rebuild; the package stays at `f616daa`.** Evidence package to OCIO; repository hardened; stale build-script reference removed (**done in v2.01**) | B (settings), C (list and package) | C: write the hardening list (branch protection on `main`, required review, signed commits, secret scanning and push protection, Dependabot alerts) as one page for Brad. Rebuild the evidence package at `c357911` **only if** OCIO wants it to name `main` (its files equal `f616daa`). Brad changes the settings. |
| C3 | 20 Nov | CUI categorization confirmed | B | — |
| C4 | 18 Dec | Hosting platform selected (D) | B | Then D+30, D+90, D+120, D+135, D+150 and D+180, per the POA&M. |
| C5 | — | Item 100: DoD security standards for the IL5 Azure environment | B (security team) | Waits on the security team's answers to the 15 deployment questions. |

### C. Decisions waiting on Brad

| # | Decision | Where | Options |
|---|---|---|---|
| D1 | **Brad, 20 Oct: option 1 (C4a). Its files are on no branch (scratchpad only), so rebuild it or get it from Codex.** **U51**: what a locked view still allows (edits kept while the banner says read only) | Ledger U51; post-merge queue item 1 | Option 1 = Codex C4a (built and verified at `rec/L6/u51/codex-c4a/`, base `f6f4c26`). Option 2 = C4b (skip the three list pulls while a view is on screen; not built; Codex was to build it). |
| D2 | **Brad, 20 Oct: all four (destinations, bands, BAE list, PMO list with the data pack).** U52 / U53 / item 89: what a locked cycle keeps of its own (PMO list, funds-flow money, destinations, bands, BAE list, data pack) | Ledger U52, U53; `NEXT-VERSION.md` item 89 | Brad set priority on 6 Oct: "keeping these lists with the cycle has priority". Pick which lists first. |
| D3 | Item 63: office-by-month cells within $1 | `NEXT-VERSION.md` 63 | Design review per Brad's 6 Oct note. |
| D4 | Item 71: shared side lists' read-merge-write window | `NEXT-VERSION.md` 71 | Per-writer files and/or SharePoint eTags (Brad, 6 Oct). Needs a design. |
| D5 | Item 82: funds-flow scope, ACE breakout basis, kept-cycle services | `NEXT-VERSION.md` 82 | Several are Brad's call, as listed there. |
| D6 | Item 84: older-version reading of v1.98+ files; RCN-EEIC ask for a split prime | `NEXT-VERSION.md` 84 | Compatibility review. |
| D7 | U14's open questions (the `rlgIsUpl` line's place; type-ins in a year no longer offered; what "genuine stored plans" takes in) | Ledger U14 | — |
| D8 | U47: a saved state that is not JSON opens without it and the warning is replaced. Its finder rates it P1, data loss. | Ledger U47 | Raised as a judgment call; still deferred. |

### D. Fixes queued (post-merge queue of 19 Oct, brought current)

| # | Action | Owner | Next step |
|---|---|---|---|
| E1 | **Built 20 Oct (`224529d`).** **U62**: "Save yours over theirs" can say "Nothing was written." just after it wrote a history copy | C | Reproduce, fix the words, add a check that fails before and passes after. |
| E2 | **Decode `_xHHHH_` at import** (U37's named limit: a literal `_xHHHH_` in a workbook is refused) | C, X | Codex P1 was to write the memo first. Build after the memo. |
| E3 | **Built 20 Oct (`6f3417b`).** **U72**: beside U44's part (c), Used by can be blank and ✕ can remove a destination another board's file still uses | C | Named limit in v2.00. Fix with a check. |
| E4 | **Built 20 Oct (`6f3417b`, `9dc0a57`).** **U60**: U18's stopped save writes browser storage before the hold stops it | C | A follow-up to U18. |
| E5 | **Built 20 Oct (`e64553a`): the workbook sheet, Brad's choice.** **U9 labelling** (Brad, 13 Oct: label the office figure as the planning share and the Spend Plan Source lines as CLIN amounts, with a reconciliation; no dollar moves) | C | Its own small track. Codex's canonical CLIN roll-up is a separate later change. |
| E6 | **Run 21 Oct; results in `NEXT-VERSION.md` E6 (one should-fix: sheet names from office names).** The lean gate's skips: the UI-C1 re-check on the integrated tree; the two G22 cross-track reviews (exports, locked views); U37's round-8 tests review (Codex D6 replaced it and was never sent) | C, X | Run against `main`. Treat any must-fix as an item. |
| E7 | **Triaged 21 Oct (`NEXT-VERSION.md` E7): U9, U43, U24, U29, U31, U19H reproduced, with fixes proposed; U9L closed (E5); U28 not seen.** Non-blockers deferred at the 18 Oct cut: U9 with U43, U9L, U24/U29/U31, U19H, U28 c1 | C | Triage each against `main` first. Some may be closed by later commits. |

### E. The ledger's other open rows

Open or not selected as of `main`. **Verify each row against `main` before working it.** Rows marked "closed when the
lead integrates `<sha>`" may already be in: check that the commit is an ancestor of `main` (`git merge-base
--is-ancestor`).

- **Saving, reopening and live view:** U5, U6, U15, U16, U17, U19, U21, U22, U23, U24, U25, U26, U27, U29, U31, U35,
  U63 (P1), U64.
- **Locked cycles:** U49, U50, U54.
- **Codes and registry:** U7, U38, U39, U61.
- **Imports and SI values:** U41, U45, U56, U57, U58, U59, U65, U66, U67.
- **Funds flow and destinations:** U42, U43, U55, U68, U69, U70, U71.
- **Words and Help:** U8, U48.
- **Tracked:** U11, U12. **UI:** UI-m1…m7.
- **`NEXT-VERSION.md` Later:** 19 (one way to tell the user something), 20 (one place for each field's name).

### F. Carried limit

**layout-fits D**: the first requirement is not on screen as the board opens, at 8 sizes. Brad carried it from v2.00.
Every browser run reports these 8. Any other browser failure is real.

### G. Nothing in flight

No background job, sweep, agent or PR is running. Nothing is half-built or uncommitted. The scratchpad holds the sweep
pilot's data (`sweep/`, including `shard-proof/calibration.json`) and the OCIO build files. All of it is lost when this
session ends, and calibration is re-run in about 18 min.

## 5. Brad's standing rules (as of 20 Oct 2026)

1. **No PR merge, no deployment and no publishing without Brad's go.** Draft PRs are fine. Never force-push, and never
   rewrite history on a shared branch.
2. **The can't-fails are data loss and money.** Every exportable product must be exactly right, and every word on
   screen must stay true.
3. **The mutation sweep runs only on Brad's named go.** The full text is in `CLAUDE.md` ("The sweep runs on Brad's named
   go").
   - During development `mutate.mjs` is TEXT ONLY: use `recovery/v200/bin/mkmut.py` and `mcount.py` with `python3 -I`.
   - Never `import` it, and never run `npm run mutate` or `validate:math`.
   - `npm run validate:nightly` may be run at any time.
4. **Changes ship as one version on "go".** Log each change in `NEXT-VERSION.md` first. Nothing in the board changes
   until Brad says go. Then bump `BUILD` once and push once.
5. **Never run `playwright install`. Never commit a populated board.**
6. **`audit-import` runs alone.** It takes about 16 minutes.
7. **Expected values in tests are hand-written literals.** A new check fails on the base and passes on the fix; a
   CONTROL passes on the base and fails on its own mutant. Prove both before claiming either.
8. **Usage.** Brad's weekly usage was at 86% on 20 Oct and resets Saturday night (24 Oct). Work in long background runs
   with rare check-ins (section 7). Ask before anything large.
9. **Ask with AskUserQuestion only while background work is running.** It holds the turn until Brad answers.
10. **The OCIO response does not mention AI tools.** OCIO deliverables are CUI and never go into git.
11. **Commits** end with the attribution lines the session's own system gives it; GitHub comments end with the Claude
    Code footer. No model name goes into anything pushed.

## 6. Lessons learned

### From the handoff v2.01 received (kept from the earlier draft)

**What worked:** "Read this first" at the top, the decisions table with dates, a list ordered by what to do next,
ready-to-paste lines for Codex, and the "did not work" list. Keep all five.

**What cost time, and the rule that would have prevented it:**

| What happened | Rule for next time |
|---|---|
| The checkout was shallow; two import tests and one recon test failed reading old commits. | "Unshallow first" is in the pick-up steps. |
| Bumping `BUILD` broke 43 expected messages ("ORBIT v2.00 saved it"), and two fixtures that faked an older version quietly stopped faking it. | When you bump `BUILD`, search the suites for the old version string and for `BUILD='v` regexes before running anything. The fakes now match any version and assert it. |
| The tools the handoff named (`focus-block.py`, `mkmut.py`, `mcount.py`) were partly only on the backup branch, and `focus-block.py` refused the U44 block because its header is longer than 20 lines. | Tools a handoff relies on must be on the branch being worked. A 200-line-window `focus-block.py` is in `recovery/v202/bin/`. |
| Codex's D5 diffs were on Brad's machine, and Codex went offline; D5 was rebuilt from its description. | Ask Codex for diffs **inline** in its report, and adopt or reject them the same day. |
| The evidence builder had the old session's paths, said "no lockfile yet", and read a stale local `main`. | Tools that build deliverables take paths as arguments and read `origin/main`. |
| **`mutate.mjs` did not parse** (two missing commas since v2.00). Everyone read it as text, so nobody saw it. | `npm run check` now parses it (`node --check`, which runs nothing). |
| The nightly Routine contradicted the new rule and was ending its turn 44 seconds into a sweep it could not finish. Nothing in the handoff mentioned Routines. | List every Routine and its state in a handoff (section 3). Run `list_triggers` when you pick up. |
| The rule "mutate.mjs is text only" lived only in a handoff on the backup branch, while `CLAUDE.md` still said to run `npm run mutate`. | Standing rules go in `CLAUDE.md` / `AGENTS.md`. |
| `git add -A` committed a scratch file the verification had copied into `tools/`. | Keep scratch copies outside the repo. Read `git status` before every commit. |
| A subagent's report (D5) looked complete but had one silent-pass path: a missing history commit skipped both controls. | Verify an agent's work yourself: rerun its block on the board and on each mutant, then read the code for paths that skip. |
| The RECORD panel's problems were found from Brad's photo, not by a check. | `layout-fits` K now reads every panel. A new control or figure in the panel must pass K. |

### From v2.01 itself (new)

| What happened | Rule for next time |
|---|---|
| The handoff v2.01 received had no list of accesses. The repository rename, Routine attachments and GitHub access were rediscovered as needed. | Section 2: every access, how to get it, and who can grant it. |
| The open items were spread over five places (`NEXT-VERSION.md`, the ledger, the post-merge queue on the backup branch, the previous handoff, PR text). | One tracker (section 4) with owner and next step, updated in the same commit that changes an item. |
| The backup branch's ledger was older than `main`'s, and both are named the same. | Name which copy is current (section 1). |
| `CLAUDE.md` still carries the unfilled placeholder `GATE_V200`, unnoticed through a whole version. | Before a merge, `grep -n 'GATE_V\|SWEEP_RESULT\|TODO' CLAUDE.md recovery/*/HANDOFF.md`. |
| The old sweep crashed on 6 of 19 targets: recon block 80 needs 6.5 GB and import blocks 105, 107 and 108 need 5 GB, while suites are capped at 2.5 GB. A CRASHED read like "not covered". | Use the sharded sweep. It calibrates each piece's memory and never counts a death as a catch. |
| The sharded sweep is correct but not faster: about 4 min per target, about 60 hours for 895. | Budget it as days of machine time in saved batches, started after a usage reset, with one watcher. Do not promise a speed-up that has not been measured. |
| Asking "how long" and "almost done?" cost Brad several check-ins. | Give the estimate with its basis up front, and update it only when it changes. |
| The draft PR was merged by a go given in chat. | On "merge": re-read the PR (`mergeable_state`, head SHA), mark it ready, merge with `expectedHeadSha`, confirm `merged: true`, unsubscribe, and diff `main` against the head. |

## 7. Working within the usage budget

- **Long runs are cheap; check-ins are not.** Each wake re-reads the whole conversation.
- Start a long job detached (`setsid nohup … &`). Arm **one** background watcher that waits for its done file or for
  the process to die, then stop and wait.
- Background jobs are capped at two hours. For longer work, use a restart-proof runner (saved batches with `.done`
  markers that skip finished work) and re-arm the watcher on each wake.
- Batch the work into few turns. Write the handoff, notes and PR description in one pass.
- A subagent for a large self-contained job keeps the main context small (D5 cost about 400k tokens). Its result must
  still be verified (section 6).
- Do not run two heavy suites at once: `audit-recon` and `audit-import` take 14–16 minutes each, and 15 GB of memory is
  tight.

## 8. How to pick up (a new Claude session)

1. **Access (section 2):** start in the "Sustainment Portfolio Management Tool" environment with `orbit-board` attached
   for push (`add_repo` if not), then run `git fetch --unshallow origin`.
2. Read `CLAUDE.md`, `AGENTS.md` and this file.
3. Run `git log -1 origin/main` and check that it is `c357911` or later. Branch from `main`.
4. Run `npm ci`, then `npm run check`.
5. Run `list_triggers` and compare with section 3. Read the latest nightly math report (A2).
6. Ask Brad, in this order:
   - the sweep go (A1), after the Saturday reset;
   - U51's option (D1);
   - which locked-cycle lists come first (D2);
   - whether OCIO wants the evidence rebuilt at `c357911` (C2).
7. While waiting, take A3 and A4, then section D in order.

**Commands.**
- Suites: `node tools/export-audit/<suite>.mjs` (run `audit-import` alone).
- Browser checks: `npm run verify:grid`. It stops at the first failing tool, and the 8 D results stop it at `layout`,
  so run `keys`, `dropdowns`, `dialogs` and `leftmenu` separately.
- Focused block: `python3 -I recovery/v202/bin/focus-block.py <suite> <out> "<header prefix>"`, with `BOARD=<board>` and
  `SUITE_CHECKS=<file.jsonl>`.
- Mutant: `python3 -I recovery/v200/bin/mkmut.py tools/export-audit/mutate.mjs <board> <id> <out.html>`.
- Count: `python3 -I recovery/v200/bin/mcount.py tools/export-audit/mutate.mjs <board>` (expect 2,021, each once).
