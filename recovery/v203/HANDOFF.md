# ORBIT: handoff for v2.03 (21 Oct 2026, 4:10 PM ET, after v2.02 merged)

**From:** the lead on ORBIT v2.02 (Claude, session `session_01T4fWzvCc32LsJCRBxFTXJY`). **For:** Brad, and whoever picks
up next (a new Claude session, Codex, or Brad).

**Where this file is:** `recovery/v203/HANDOFF.md` in `bradludington-ui/orbit-board`. The v2.02 handoff
(`recovery/v202/HANDOFF.md`) is the record of how v2.02 started. This file says where things stand now. Where the two
disagree, this one is current.

All times are Eastern unless marked UTC.

---

## 0. Read this first

1. **v2.02 is on `main`.** PR #16 was merged on Brad's go ("Merge when the gate passes") at 3:43 PM on 21 Oct.
   - Merge commit: `b68b319`. Its files are those of the PR head `b5d7c7a`.
   - `main` reads `BUILD='v2.02 (21 Oct 2026)'`.
   - Every v2.03 branch starts from `main`.
2. **On `main` only.** Nothing has been tagged as a release or copied to the shared drive. Getting the file to the
   people who open the board is Brad's step (section 4, B0).
3. **The mutation sweep is next, and Brad scheduled it.** Brad, 20 Oct: after the Saturday 24 Oct usage reset, from a
   fresh session. Section 4, A1 has the plan.
4. **Check a PR's state before acting on it** (`pull_request_read get`, then read `merged`). Clone with full history: if
   `git rev-parse --is-shallow-repository` says true, run `git fetch --unshallow origin`.
5. **`CLAUDE.md` and `AGENTS.md` hold the standing rules.** Read them first; they win over this file.
6. **The tracker is section 4.** Update it in the same commit that changes an item's state.

## 1. Where things stand (21 Oct, 4:10 PM)

| Thing | State |
|---|---|
| `main` | **v2.02**, merge commit `b68b319` (PR #16). |
| PR #16 | Merged. The session is unsubscribed from it, and its check-in Routine is deleted. |
| `ccr-f11beb69-61ml9m` | v2.02's working branch, restarted from `main` for this handoff. |
| Last full gate | `npm run validate:nightly` on `b5d7c7a` (the merged files), 21 Oct 3:06–3:43 PM. Every stage clean except the 8 carried layout-fits D results. Details below. |
| Mutation targets | `mcount`: **2,083** entries, each matching the board exactly once. |
| Mutation sweep | **Not run on v2.00, v2.01 or v2.02 as a set.** Every target added since v2.00 was proven one at a time against its own check. |
| Worktrees used in v2.02 | `wt-rp`, `wt-small`, `wt-89` lived in the old session's scratchpad. Their work is all on `main`, and they are gone with that session. |
| OCIO POA&M (WO59515) | The evidence package stays at `f616daa` (Brad, 20 Oct: no rebuild). The PDF and zip are with Brad, not in git (CUI). |
| `orbit-review-mcp` | Untouched since `acbeb7e` (10 Oct). Nothing is open on it. |

**The gate on the merged files** (`b5d7c7a`):

| Stage | Result |
|---|---|
| Defect register | 13 known defects, guarded by 43 mutations |
| Money coverage | 25/25 surfaces, 0 gaps |
| Money map | 322 cells: 120 proven, 202 n/a, 0 open |
| Trace matrix | 92 cells, every link holds |
| Suites | all clean: 9 banners plus the legacy line (30 min) |
| Browser checks | only the 8 carried layout-fits D results failed (6 min) |
| Fuzz | nothing lost, seed 643474569 |
| File verifier self-test | held |

The cell counts are lower than v2.01's (329 → 322, 123 → 120 proven, 26 → 25 surfaces) because the ATR/BTR export was
removed with its cells. Nothing that is still in the product lost coverage.

## 2. What v2.02 changed (short form)

The full record is `NEXT-VERSION.md` › Shipped › v2.02, and CLAUDE.md's v2.02 section.

**Saving and opening (data loss)**
- **E1:** "Save yours over theirs" no longer says "Nothing was written" after it wrote a history copy.
- **E3:** "Used by" names every board's file that uses a destination, and ✕ refuses to delete one that is in use.
- **E4:** a folder save stopped by the import hold writes nothing.
- **E7:** the unsaved-changes count now covers a reopen, the shared state file, a batch import and a folder take.
- **U47:** an unreadable saved state keeps its warning while the board opens.
- **D4:** shared execution data merges per appropriation.
- **D6a:** a file from a newer ORBIT is refused at the door.

**Locked cycles**
- **U51:** a locked cycle is report and view only. It can be reopened from the working plan, and every lock and reopen
  is stamped.
- **Item 89:** a cycle keeps its own destinations, bands, BAE rows, PMO list, data pack and funds-flow money.
- **D5b is not built** (Brad: services stay fixed while a cycle holds them).

**ATR/BTR tracking removed.** The saved log (`rpDb`) is still carried, untouched.

**Money and exports**
- **E2:** a workbook's `_xHHHH_` codes are decoded at import.
- **E5:** the office share is reconciled against the CLIN amounts on a new sheet.
- **E6:** office names are made into safe sheet names.
- **E7:** CLIN-office ties are split exactly.
- **D3:** every office-by-month cell is within $1.
- **D5a:** the ACE breakout prints Funded beside Allocated.
- **D5c, D6b, D7b, D7c:** smaller fixes.

## 3. Access and Routines

Section 2 of `recovery/v202/HANDOFF.md` lists every access, how a new session gets it, and who grants it. It is still
current. In short:
- Start in the "Sustainment Portfolio Management Tool" environment (`env_01TABfDTVRXVJvQvBaTXZ64y`), with `orbit-board`
  attached for push (otherwise `add_repo`, access `push`).
- Use the GitHub MCP tools (there is no `gh`).
- Use auto permission mode.
- Repository settings can be changed only by Brad.

**Routines (from `list_triggers`, 21 Oct, 4:05 PM)**

| Routine | Schedule | State | Note |
|---|---|---|---|
| Nightly ORBIT math validation (no sweep): `trig_01MNk6Db7rBPGhnxChGUXkMu` | 07:00 UTC daily | enabled | Its first run on v2.02 is 22 Oct, 07:00 UTC. Read that report first when you pick up (A2). The 21 Oct run took 39 seconds; check whether it ran the gate or stopped early. |
| Nightly ORBIT data-loss fuzz: `trig_01RAstTxNdkTfJYrZrA2dJyv` | 09:00 UTC daily | enabled | Last run 21 Oct succeeded. |
| Weekly ORBIT Interface Review: `trig_01DuixcCjkGaHDJw6JtTCK5o` | Mondays 08:00 UTC | enabled | Next run 26 Oct; its first on v2.02. |
| "Check-in on PR #16" | — | deleted | It was PR #16's safety net. |
| v2.00 overnight check-in (hourly): `trig_01PhhHK97YTPeEsCZr3X2fvw` | — | disabled | Obsolete. Brad may delete it. |

"Ludington Around Town research" is Brad's own Routine, not ORBIT's. Leave it alone.

## 4. Tracker: every open action

Owner: **C** = the Claude lead, **B** = Brad, **X** = Codex. "Ledger" means `recovery/v200/UNRESOLVED-LEDGER.md` on `main`.

### A. Verification (first)

**A1. The mutation sweep.** Owner: C. Waiting on Brad's named go, after the 24 Oct reset. Order:
1. The targets added or rewritten in v2.00, v2.01 and v2.02: the `v200-*`, `v201-*` and `v202-*` ids, plus the
   retargeted ones that `NEXT-VERSION.md` names per version.
2. Then all 2,083.

How to run it:
- Use `tools/export-audit/sweep-shards.mjs`, in saved batches, on a committed tree, with nothing else running.
- Measured on v2.01: about 4 minutes per target, so about 60 hours for 895 targets. Budget days, not hours.
- Arm one watcher, and use few check-ins.
- A survivor gets a check, never a deleted mutation.

**A2. Read the 22 Oct 07:00 UTC nightly math report.** Owner: C. Anything other than the 8 D results failing is real:
open it as an item.

**A3. After the version bump, sweep the suites for hard-coded versions.** Owner: C. v2.02's bump broke one expected
message that said "ORBIT v2.01" (fixed in `b5d7c7a`; the check now reads BUILD). Before the next bump, run
`grep -rn "ORBIT v2\.0[0-9]" tools/` and fix any literal that should follow BUILD.

### B. Rollout and OCIO

| # | Date | Action | Owner | Next step |
|---|---|---|---|---|
| B0 | — | **Put v2.02 where people open the board.** Take `prioritization-board-grid.html` from `main`. The file in git carries no data. Opening a populated board in v2.02 heals it on open. **A saved v2.02 file is refused by v2.01 and older** (D6a), so everyone should move to v2.02 together. | B | A release tag on request (C). |
| C1 | 23 Oct | Interim pilot restrictions in effect | B | Brad confirms. |
| C2 | 6 Nov | Evidence package to OCIO; repository hardened | B (settings), C (list) | The package stays at `f616daa`. C writes the hardening list (branch protection, required review, signed commits, secret scanning) for Brad to apply. |
| C3 | 20 Nov | CUI categorization confirmed | B | — |
| C4 | 18 Dec | Hosting platform selected (D) | B | Then the POA&M's D+30 … D+180 milestones. |
| C5 | — | Item 100: DoD standards for the IL5 Azure environment | B (security team) | Waits on the answers to the 15 deployment questions. |

### C. Design questions still open (each in `NEXT-VERSION.md` › Open)

| # | Question | Where | Note |
|---|---|---|---|
| D1 | The shared side lists' read-merge-write window: two people saving at once can still lose one write | Item 71 | D4 closed it for execution data only. Brad, 6 Oct: per-writer files first, then SharePoint eTags. Needs a design. |
| D2 | Two people sharing different cost estimates under one name at the same instant | Item 63 | Brad, 6 Oct: stays as is, with the fingerprint protection. Listed for completeness. |
| D3 | The remaining item 82 points: a kept cycle fixes its services (Brad chose this in D5b); journal entries from before a service-list change; side lists' unsaved state lasts one session; items 77–79 untested with real File System Access | Item 82 | D5a, D5c, D7b and D7c closed the rest. |
| D4 | An older version reading a v1.98+ file; a kept cycle's CLIN pointers after a combination is removed; the Classify grid's RCN/EEIC column | Item 84 | Compatibility review. D6a now refuses a newer file at the door, which changes the question: an older ORBIT no longer reads a v2.02 file at all. |
| D5 | U14's open questions | Ledger U14 | — |
| D6 | U28 (c1) | Ledger U28 | E7's triage did not reproduce it on `981a334`. Close it, or find a reproduction. |

### D. The ledger's other open rows

**Check each row against `main` before working it.** v2.02 closed U9, U19H, U24, U29, U31, U43, U47, U51, U52, U53, U60,
U62 and U72. The list of the rest is in `recovery/v202/HANDOFF.md` section 4.E:
- saving and live view: U5–U35, U63 (P1), U64;
- locked cycles: U49, U50, U54;
- codes: U7, U38, U39, U61;
- imports: U41–U67;
- funds flow: U42–U71;
- words: U8, U48;
- tracked: U11, U12;
- UI: UI-m1…m7.

`NEXT-VERSION.md` › Later: 19 and 20.

### E. Carried limit

**layout-fits D:** the first requirement is not on screen as the board opens, at 8 sizes (it sits 323–420 px down). Brad
carried it from v2.00. Every browser run reports these 8; any other browser failure is real.

### F. Nothing in flight

- No background job, sweep, agent or open PR.
- Nothing is uncommitted.
- The old session's scratchpad held the v2.02 builder specs (item 89, ATR/BTR removal), the gate logs and the worktrees.
  It is lost when that session ends; everything that mattered is in git.

## 5. Brad's standing rules

Unchanged from `recovery/v202/HANDOFF.md` section 5. The short form:
1. No merge, deploy or publish without Brad's go. Draft PRs are fine.
2. The can't-fails are data loss and money.
3. The sweep runs only on Brad's named go. During development, `mutate.mjs` is TEXT ONLY: use `mkmut.py` and
   `mcount.py` with `python3 -I`. Never `npm run mutate` or `validate:math`. `validate:nightly` may run at any time.
4. Changes ship as one version on "go": log the change in `NEXT-VERSION.md` first, bump `BUILD` once, push once.
5. Never `playwright install`. Never commit a populated board.
6. Run `audit-import` alone (about 16 minutes).
7. Expected values are hand-written literals. A new check fails on the base and passes on the fix; a CONTROL passes on
   both.
8. Ask before anything large; work in long background runs with few check-ins.
9. OCIO deliverables are CUI and never go into git. The OCIO response does not mention AI tools.
10. Commits end with the session's attribution lines. GitHub comments end with the Claude Code footer. No model name in
    anything pushed.

## 6. Lessons from v2.02

| What happened | Rule for next time |
|---|---|
| Parallel worktree builders (ATR/BTR removal, item 89, the small fixes) kept the lead's context small. Their merges conflicted only in `mutate.mjs`. | Give each builder a written spec (what to keep, what to remove, its tests, how it reports) and its own worktree. Merge `mutate.mjs` by hand, keeping both sides, then run `mcount`. |
| Two of three mutant runs started side by side were killed for lack of memory. A full audit was killed (exit 137) while a builder ran its suites. | Run one heavy suite at a time on this machine. Never run two `mkmut` suites at once. |
| The version bump broke one expected message ("ORBIT v2.01 saved it") and failed the gate after a clean run. | Before bumping, grep the suites for the old version (A3). Better: derive the version from BUILD, as `b5d7c7a` now does. |
| A D3 mutation survived its first check, because the fixture never reached the tight band's failure. | Every new check is unfinished until a mutation has gone red against it. When one survives, add a direct counterexample. |
| The D5c fixture used the wrong PPBE position shape and passed without reaching the code. | Check that the fixture reaches the line before trusting the check: plant the mutant and watch it fail. |
| A merge commit's files were confirmed identical to the PR head only by hand. | On "merge": re-read the PR, mark it ready, merge with `expectedHeadSha`, confirm `merged: true`, unsubscribe, delete its check-in Routine, and check `main`'s BUILD. |

## 7. How to pick up (a new Claude session)

1. Set up access (section 3). Then `git fetch --unshallow origin` if the clone is shallow.
2. Read `CLAUDE.md`, `AGENTS.md` and this file.
3. Confirm `git log -1 origin/main` is `b68b319` or later. Branch from `main`.
4. Run `npm ci`, then `npm run check`. Run
   `python3 -I recovery/v200/bin/mcount.py tools/export-audit/mutate.mjs prioritization-board-grid.html`
   and expect 2,083 entries, each matching once. Then run `git checkout -- recovery/v200/bin/__pycache__/`.
5. Run `list_triggers` and compare it with section 3. Read the latest nightly math report (A2).
6. Ask Brad, in this order:
   - the sweep go (A1), after the 24 Oct reset;
   - whether he wants a release tag for v2.02 (B0);
   - which design question comes first (section 4.C).

**Commands**
- Suites: `node tools/export-audit/<suite>.mjs`. Run `audit-import` alone.
- Browser checks: `npm run verify:grid`. The 8 D results stop it at `layout`, so run `keys`, `dropdowns`, `dialogs`
  and `leftmenu` separately.
- The gate without the sweep: `npm run validate:nightly`. It takes about 37 minutes.
- A focused block: `python3 -I recovery/v202/bin/focus-block.py <suite> <out> "<header prefix>"`. It cannot cut
  audit-board's or audit-recon's bare blocks; run those suites whole.
- A mutant: `python3 -I recovery/v200/bin/mkmut.py tools/export-audit/mutate.mjs <board> <id> <out.html>`.
- The sweep (on Brad's go only):
  `node tools/export-audit/sweep-shards.mjs --ids FILE [--out DIR] [--jobs N]`. It can resume; see CLAUDE.md.
