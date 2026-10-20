# ORBIT: handoff for v2.02 (written 20 Oct 2026)

**From:** the lead on ORBIT v2.01 (Claude), for Brad and whoever picks up v2.02: a new Claude session, Codex, or Brad.
**Where this file is:** `recovery/v202/HANDOFF.md` in `bradludington-ui/orbit-board`, committed with PR #14 (v2.01).
All times are Eastern.

---

## 0. Read this first

1. **Check every PR's state before acting on it.** Run `pull_request_read get` and read `merged`.
   - PR #13 (v2.00) was merged a minute after it was opened. The previous lead worked for a day as if it were still open.
   - **PR #14 is v2.01.** At the time of writing it is an open draft, waiting for Brad to merge it.
   - If #14 is merged, `main` is v2.01. If it is not, `main` is still v2.00 *without* the left menu, the 508 fixes and the lockfile (see the v2.01 section of `NEXT-VERSION.md`).
2. **Clone with full history** (`git fetch --unshallow origin` if `git rev-parse --is-shallow-repository` says true). Several checks rebuild boards from old commits (`68b02e9`, `7ee498a`), and a shallow clone fails them for a reason unrelated to the board.
3. **Read `CLAUDE.md` and `AGENTS.md` first.** Since v2.01 the standing rules are written there, not only in handoff files. Where this file and those two disagree, they win; tell Brad about the conflict.
4. **Anything kept only in a session's scratchpad is lost when the session ends.** That includes the OCIO PDF, the evidence zip, the sweep logs and Codex's diffs. Deliver files to Brad with `SendUserFile` the moment they exist, and say so.

## 1. Where things stand

| Thing | State |
|---|---|
| `main` | v2.00 (`ea7e76e`) until #14 merges |
| PR #14 (`ccr-24c317db-e0vz0v`) | v2.01: the 8 commits v2.00 left behind, D4-1, the readable RECORD panel (102), the 35-character PID (103), D5, the sweep rule, `validate:nightly`, and the `mutate.mjs` parse fix. Merges cleanly. Draft; Brad merges. |
| `claude/orbit-v2.00` | `c6ba63f`, now fully contained in #14. Do not add to it. |
| `claude/v200-fixes-wip` | The v2.00 backup and records branch: the ledger, the Codex handoffs, the previous handoff. Read-only for v2.02 unless Brad says otherwise. |
| The v2.01 sweep | **Not run in full.** The ~895 targets added or rewritten since v1.99 are listed by `tools/export-audit/mut-json.py` (compare with `6388472`'s list). A 20-target pilot with `mutate.mjs` took 4.5 min a target and 6 of 19 CRASHED (out of memory: recon block 80 peaks at 6.5 GB, import blocks 105 and 107-108 need 5 GB, and the sweep caps a suite at 2.5 GB). The sharded sweep (`tools/export-audit/sweep-shards.mjs`, section 3A) gave all 20 a verdict -- every one caught -- and its controls held (a no-op SURVIVED, a declared equivalent came back equivalent), but at about 4 min of wall time a target: ~60 hours for 895. |
| The OCIO POA&M (WO59515) | PDF rebuilt 20 Oct ("not yet fully deployed"); evidence package built at `f616daa`. Both were delivered to Brad and are **not** in git (CUI). The generator `build_pdf.py` and the builder `build_evidence.sh` are in Brad's hands; ask him for them. |
| Routines | "Nightly ORBIT math validation (no sweep)" runs `npm run validate:nightly` at 07:00 UTC. Until v2.01 is on `main` it reports one line ("main predates v2.01") and stops. Also active: the nightly data-loss fuzz (09:00 UTC) and the weekly interface review (Mondays). |

## 2. Brad's standing rules (as of 20 Oct 2026)

1. **No PR merge, no deployment and no publishing without Brad's go.** Draft PRs are fine. Never force-push. Never rewrite history on a shared branch.
2. **The can't-fails are data loss and money.** Every exportable product must be exactly right, and every word on screen must stay true.
3. **The mutation sweep runs only on Brad's named go** (20 Oct; full text in `CLAUDE.md`, "The sweep runs on Brad's named go"):
   - During development `mutate.mjs` is TEXT ONLY: use `recovery/v200/bin/mkmut.py` and `mcount.py`, run with `python3 -I`.
   - Never `import` it, and never run `npm run mutate` or `validate:math`.
   - A named sweep runs on a committed tree that does not change during the run, in saved batches, with nothing else running, and only reports.
   - `npm run validate:nightly` (every stage but the sweep) may be run at any time.
4. **Never run `playwright install`.** Never commit a populated board.
5. **`audit-import` runs alone.** It takes about 16 minutes.
6. **Expected values in tests are hand-written literals.**
   - A new check fails on the base and passes on the fix.
   - A CONTROL passes on the base and fails on its own mutant.
   - Prove both before claiming either.
7. **Usage.** Brad's weekly usage was at 86% on 20 Oct, resetting Saturday night. Work in long background runs with rare check-ins (section 5). Ask before anything large.
8. **Ask with AskUserQuestion only while background work is running.** It holds the turn until Brad answers.
9. **The OCIO response does not mention AI tools.**
10. **Commits** end with the attribution lines the session's own system gives it. GitHub comments end with the Claude Code footer.

## 3. Open items for v2.02, in the order to take them

**A. Finish v2.01's sweep** (Brad's go is given: 20 Oct). Use `node tools/export-audit/sweep-shards.mjs --ids <file> --out <dir>` (exact ids; it splits recon and import into 38 calibrated shards, gives a shard that dies 5 then 8 GB of heap, and saves each result as it lands, so a restart resumes). Run it detached from a FRESH, SHORT session after the usage reset: the run is machine time, but every wake of a long session re-reads all of it. Before the full run, measure the shard order the tool now uses (inject first for `v200-*`, then shards naming the id's workstream tag, then the area) on a few slow pilot targets (`v200-cyc-title-html` took 67 min, `v200-u44-copy-not-text-read` 51); if it is not much faster, sweep the money-critical workstreams first (U44, U40, R1-R5, U19) rather than all 895. See section 1. A SURVIVED target is a line nothing protects: add the check, never delete the mutation. A CRASHED target is a suite that died, not a catch (check memory: suites are capped at 2.5 GB in the sweep). Record the result in `NEXT-VERSION.md` under v2.01.

**B. After #14 merges:**
- Re-point any "base" in handoffs at the merge commit.
- Run `npm run validate:nightly` once on `main` to confirm the Routine's first real night will pass.
- If OCIO wants evidence that names `main`, rebuild the evidence package at the merge commit. Its files are identical to `f616daa`.

**C. OCIO milestones** (the POA&M):

| Date | Milestone |
|---|---|
| 23 Oct | interim pilot restrictions in effect |
| 6 Nov | evidence package to OCIO, repository hardened, stale build-script reference removed (done in v2.01) |
| 20 Nov | CUI categorization confirmed |
| 18 Dec | hosting platform selected (D) |

Then D+30, D+90, D+120, D+135, D+150 and D+180, as listed in the POA&M. "Repository hardened" means branch protection, required review, signed commits and secret scanning. Those are GitHub settings that only Brad can change; a session cannot. Prepare the list and give it to him.

**D. The post-merge queue** (from `recovery/v200/session-records/POST-MERGE-QUEUE-2026-10-19.md` on `claude/v200-fixes-wip`, brought current):

1. **U51** (what a locked view still allows): Brad picks option 1 (Codex C4a, verified) or option 2 (C4b, not yet built).
2. **U62:** words after "Save yours over theirs" wrote a history copy ("Nothing was written."). Reproduce it, then fix it with a check.
3. **Decode `_xHHHH_` at import** (U37's named limit). Codex P1 was to write the memo first.
4. **U72:** next to U44's part (c), Used by can be blank and ✕ can remove a destination another board's file still uses.
5. **U60** (a hold line and a storage write under the hold).
6. **The lean gate's skips still open:** the UI-C1 re-check on the integrated tree; U37's round-8 tests review (Codex D6 was its replacement and was never sent).
7. **Non-blockers deferred at the 18 Oct cut:** U9 with U43, U9L, U24/U29/U31, U19H, U28 c1.
8. **The other deferred ledger rows** (`recovery/v200/UNRESOLVED-LEDGER.md`) and `NEXT-VERSION.md` items 63, 71, 82, 84, 89, 100 (waits on the security team) and 101 (a test-tool fix, small).

**E. The carried layout limit.** `layout-fits` D: the first requirement is not on screen as the board opens, at 8 sizes. Brad carried it from v2.00. Every browser run reports these 8; treat any other failure as real.

## 4. What I received, and what I wish I had

Taken from the v2.00 handoff (`HANDOFF-2026-10-20.md`), so the next one is better.

**What worked:** "Read this first" at the top, the decisions table with dates, a list ordered by what to do next, ready-to-paste lines for Codex, and the "did not work" list. Keep all five.

**What cost time, and the rule that would have prevented it:**

| What happened | Rule for next time |
|---|---|
| The checkout was shallow; two import tests and one recon test failed reading old commits. | Say "unshallow first" in the pick-up steps. |
| Bumping `BUILD` broke 43 expected messages ("ORBIT v2.00 saved it"), and two fixtures that faked an older version quietly stopped faking it. | When you bump `BUILD`, search the suites for the old version string and `BUILD='v` regexes before running anything. Fakes now match any version and assert it. |
| The tools the handoff named (`focus-block.py`, `mkmut.py`, `mcount.py`) were partly only on the backup branch, and `focus-block.py` refused the U44 block because its header is longer than 20 lines. | Tools a handoff relies on must be on the branch being worked; a 200-line-window `focus-block.py` is committed in `recovery/v202/bin/`. |
| Codex's D5 diffs were on Brad's machine, and Codex went offline; D5 had to be rebuilt from its description. | Ask Codex for diffs **inline** in its report, and adopt or reject them the same day. |
| The evidence builder had the old session's paths, said "no lockfile yet", and read a stale local `main`. | Tools that build deliverables take paths as arguments and read `origin/main`. |
| **`mutate.mjs` did not parse** (two missing commas since v2.00). Everyone read it as text, so nobody saw it; `npm run mutate` would have died at load. | `npm run check` now parses it (`node --check`, which runs nothing). |
| The nightly Routine contradicted the new rule and had been ending its turn 44 seconds into a sweep it could not finish. Nothing in the handoff mentioned Routines. | List every Routine and its state in a handoff (section 1). Check `list_triggers` when you pick up. |
| The rule "mutate.mjs is text only" lived only in a handoff on the backup branch, while `CLAUDE.md` still said to run `npm run mutate`. | Standing rules go in `CLAUDE.md` / `AGENTS.md`, where every session reads them. |
| `git add -A` committed a scratch file the verification had copied into `tools/`. | Keep scratch copies outside the repo, or delete them before staging. Read `git status` before every commit. |
| A subagent's report (D5) looked complete but had one silent-pass path (a missing history commit skipped both controls). | Verify an agent's work yourself: rerun its block on the board and on each mutant, then read the code for paths that skip. |
| The first sweep plan assumed a rate from v1.99; the new targets live late in two heavy suites, and a suite capped at 2.5 GB died out of memory. Six hours went to building a faster sweep that turned out barely faster. | Pilot first (20 targets) and decide from its rate before spending more; ask whether the job is worth a day of the machine. |
| The RECORD panel's problems were found from Brad's photo, not by a check. | `layout-fits` K now reads every panel. A new control or figure in the panel must pass K. |

## 5. How to work within the usage budget

- **Long runs are cheap; check-ins are not.** Each wake re-reads the whole conversation.
- Start a long job detached (`setsid nohup … &`). Arm **one** background watcher that waits for its done file or for the process to die. Then stop and wait.
- Background jobs are capped at two hours. For longer work, use a restart-proof runner (saved batches with `.done` markers; skip what is done) and re-arm the watcher on each wake.
- Batch work into few turns. Write the handoff, the notes and the PR description in one pass.
- A subagent for a large self-contained job (D5 cost about 400k tokens) keeps the main context small, but its result must still be verified (section 4).
- Do not run two heavy suites at once (`audit-recon` and `audit-import` each take 14–16 minutes, and memory is tight on 15 GB).

## 6. How to pick up (a new Claude session)

1. Attach `bradludington-ui/orbit-board` with push access, clone it, then `git fetch --unshallow origin`.
2. Check PR #14's state (section 0). Branch from `main` if it is merged, otherwise from #14's head.
3. Run `npm ci`, then `npm run check` (it now also parses `mutate.mjs`).
4. Run `list_triggers` and compare the Routines with section 1.
5. Ask Brad, in order:
   - did #14 merge;
   - the sweep result (section 3A) if it is not recorded;
   - U51's option;
   - whether OCIO wants the evidence package rebuilt at the merge commit.

Suites: `node tools/export-audit/<suite>.mjs` (audit-import alone). Browser checks: `npm run verify:grid` (stops at the first failing tool; the 8 D results stop it at `layout`, so run `keys`, `dropdowns`, `dialogs` and `leftmenu` separately). Focused block: `python3 -I recovery/v202/bin/focus-block.py <suite> <out> "<header prefix>"`, with `BOARD=<board>` and `SUITE_CHECKS=<file.jsonl>`.
