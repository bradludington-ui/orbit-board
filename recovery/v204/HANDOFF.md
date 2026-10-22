# ORBIT: handoff for v2.04 (22 Oct 2026, 6:20 AM ET, after v2.03 merged)

**From:** the lead on ORBIT v2.03 (Claude, session `session_01B8Z8vuuWrEhJsx2nn2fmh6`). **For:** Brad, and whoever picks
up next (a new Claude session, Codex, or Brad).

**Where this file is:** `recovery/v204/HANDOFF.md` in `bradludington-ui/orbit-board`. The v2.03 handoff
(`recovery/v203/HANDOFF.md`, on branch `ccr-f11beb69-61ml9m`, never merged to `main`) and the v2.02 handoff
(`recovery/v202/HANDOFF.md`) are the records of how those versions started. This file is current; where they disagree,
this one wins.

All times are Eastern unless marked UTC.

---

## 0. Read this first

1. **v2.03 is on `main`.** PR #18 was merged on Brad's go ("Merge and create handoff for v2.04") at about 6:15 AM on
   22 Oct, **before the mutation sweep** -- Brad chose to merge and sweep `main` afterwards.
   - Merge commit: `065bc0d`. Its files are those of the PR head `1fefacb` (merged with `expectedHeadSha`).
   - `main` reads `BUILD='v2.03 (21 Oct 2026)'`.
   - Every v2.04 branch starts from `main`.
2. **On `main` only.** Nothing is tagged or copied to the shared drive. Getting the file to the people who open the board
   is Brad's step (section 4, B0).
3. **The mutation sweep is next**, on `main` at `065bc0d` or later, on Brad's named go after the Saturday 24 Oct usage
   reset, from a fresh session (section 4, A1).
4. **Check a PR's state before acting on it** (`pull_request_read get`, then read `merged`). Clone with full history: if
   `git rev-parse --is-shallow-repository` says true, run `git fetch --unshallow origin`.
5. **`CLAUDE.md` and `AGENTS.md` hold the standing rules.** Read them first; they win over this file. New since v2.02:
   **show only what changed** (Brad, 21 Oct) -- for a sweep, a mutation or any other modification, report only the
   changed lines or a unified diff, never a whole file or script.
6. **The tracker is section 4.** Update it in the same commit that changes an item's state.

## 1. Where things stand (22 Oct, 6:20 AM)

| Thing | State |
|---|---|
| `main` | **v2.03**, merge commit `065bc0d` (PR #18). |
| PR #18 | Merged. No subscription and no check-in Routine were set up for it. |
| `ccr-1ca5beab-y9rcwe` | v2.03's working branch, restarted from `main` for this handoff. |
| Last full gate | `npm run validate:nightly` on the v2.03 board, 21 Oct 5:50–6:30 PM: every stage clean except the 8 carried layout-fits D results. Plus `keys`, `dropdowns`, `dialogs`, `leftmenu` (pass) and `standards` (0 findings). |
| Mutation targets | `mcount` on `065bc0d`: **2,095** entries, each matching the board exactly once. |
| Mutation sweep | **Not run on v2.00, v2.01, v2.02 or v2.03 as a set.** Every target added since v2.00 was proven one at a time against its own check. |
| Nightly math, 22 Oct 07:00 UTC | Ran on `b68b319` (v2.02; v2.03 was not yet merged), ~55 min: only the 8 carried D results; 13 defects / 43 guards; coverage 25/25; money map 322 cells (120 proven, 202 n/a, 0 open); trace 92 cells; fuzz seed 778074958; verifier self-test held. **Its first run on v2.03 is 23 Oct 07:00 UTC.** |
| Nightly fuzz, 22 Oct 09:00 UTC | Succeeded (on v2.02). |
| Azure plan (item 107) | Draft 2 and five companion documents written 21–22 Oct, **outside git** (CUI), with Brad. DRAFT — NOT APPROVED. Planning only. |
| `orbit-review-mcp` | Untouched since `acbeb7e` (10 Oct). |

**The gate on the v2.03 board** (from `NEXT-VERSION.md` › Shipped › v2.03):

| Stage | Result |
|---|---|
| Defect register | 13 known defects, guarded by 43 mutations |
| Money coverage | every surface covered, 0 gaps |
| Money map | 0 open (120 proven, 202 n/a) |
| Trace matrix | every link holds |
| Suites | 9 banners plus the legacy line |
| Browser checks | only the 8 carried layout-fits D results |
| Fuzz | nothing lost, seed 961322163 |
| File verifier self-test | held |

## 2. What v2.03 changed (short form)

Full record: `NEXT-VERSION.md` › Shipped › v2.03, and CLAUDE.md's v2.03 section. **Cleaner code**, no money rule changed.

- **104 -- code nothing can reach, removed.** A parser-based trace from the top-level code and every handler in the
  markup reached 1,604 of 1,619 functions. Removed (154 lines): the command bar, `setBATot`, `moveTo`, `chipBg` /
  `bandInk`, `srcBudget`, `inboundCheckDest`. Four functions only the tests call stay as their entry points.
- **105 -- the card build's leftovers, removed.** The guide's `data-b` paragraphs, `fldHasPanel`, the row expander's
  state, `gridDedupe`, and the Filter menu's ☰ By-service detail. `render()` keeps its wrapper (`renderBoard`), on purpose.
- **19 -- one way to tell the user.** Every message is kept for the session (`STAT_LOG`); a warning, refusal or import
  result stays **⚠ N unread** until read; **Messages this session** lists them as plain text. Never written to the
  board or the journal ("session log, not file"). A new import's result goes through `statKeep()`.
- **20 -- one field registry (first slice).** `REQ_FIELD` / `FL()` / `FLI()`; `recF()` takes the key; the guide's
  `data-fl`. `npm run check` "field labels" refuses a label spelled elsewhere. Other labels move onto it as touched.
- **Two stale browser checks fixed** (`keyboard-reach` G2, `left-menu` A), failing unseen since v2.02 because
  `verify:grid` stops at `layout`.
- **Mutations:** 4 retired, 16 new (`v203-*`), 8 retargeted; 2,095 in all.

## 3. Access and Routines

Section 2 of `recovery/v202/HANDOFF.md` lists every access, how a new session gets it, and who grants it. Still current:
- Start in the "Sustainment Portfolio Management Tool" environment (`env_01TABfDTVRXVJvQvBaTXZ64y`), with `orbit-board`
  attached for push (otherwise `add_repo`, access `push`).
- GitHub MCP tools only (no `gh`). Auto permission mode. Repository settings only by Brad.

**Routines (from `list_triggers`, 22 Oct, 6:17 AM)**

| Routine | Schedule | State | Note |
|---|---|---|---|
| Nightly ORBIT math validation (no sweep): `trig_01MNk6Db7rBPGhnxChGUXkMu` | 07:00 UTC daily | enabled | 22 Oct run watched to the end (the 21 Oct worry about early exits is settled). Its clone still uses the old repo name, which redirects. |
| Nightly ORBIT data-loss fuzz: `trig_01RAstTxNdkTfJYrZrA2dJyv` | 09:00 UTC daily | enabled | 22 Oct succeeded. |
| Weekly ORBIT Interface Review: `trig_01DuixcCjkGaHDJw6JtTCK5o` | Mondays 08:00 UTC | enabled | Next 26 Oct; its first on v2.03. |
| v2.00 overnight check-in (hourly): `trig_01PhhHK97YTPeEsCZr3X2fvw` | — | disabled | Obsolete. Brad may delete it. |

"Ludington Around Town research" and "Ludington Family calendar sync" are Brad's own Routines, not ORBIT's. Leave them alone.

## 4. Tracker: every open action

Owner: **C** = the Claude lead, **B** = Brad, **X** = Codex. "Ledger" = `recovery/v200/UNRESOLVED-LEDGER.md` on `main`.

### A. Verification (first)

**A1. The mutation sweep, on `main`.** Owner: C. Waiting on Brad's named go, after the 24 Oct reset. Order (Brad, 20 Oct):
1. The targets added or rewritten in v2.00–v2.03: the `v200-*`, `v201-*`, `v202-*`, `v203-*` ids, plus the retargeted
   ones `NEXT-VERSION.md` names per version.
2. Then all 2,095.

How: `tools/export-audit/sweep-shards.mjs`, in saved batches, on a committed tree, with nothing else running; one
watcher, few check-ins. About 4 minutes a target (measured on v2.01): **budget days, not hours**. A survivor gets a check,
never a deleted mutation; a fix it needs ships as v2.04. Report only ids, find strings and replacements (CLAUDE.md).

**A2. Read the 23 Oct 07:00 UTC nightly math report** -- the first on v2.03. Anything other than the 8 D results is real.

**A3. Before the v2.04 bump**, run `grep -rn "ORBIT v2\.0[0-9]" tools/` and fix any literal that should follow BUILD
(empty on `065bc0d`).

**A4. After any menu or export change**, run `keys`, `dropdowns`, `dialogs`, `leftmenu` and `standards` by hand:
`verify:grid` stops at `layout` and never reaches them (that is how G2 and A went stale in v2.02).

### B. Rollout and OCIO

| # | Date | Action | Owner | Next step |
|---|---|---|---|---|
| B0 | — | **Put v2.03 where people open the board** (`prioritization-board-grid.html` from `main`; no data in it). A saved v2.03 file is refused by older versions (D6a, v2.02), so everyone moves together. | B | A release tag on request (C). |
| C1 | 23 Oct | Interim pilot restrictions in effect | B | Brad confirms. |
| C2 | 6 Nov | Evidence package to OCIO; repository hardened | B (settings), C (list) | Package stays at `f616daa`. C writes the hardening list (branch protection, required review, signed commits, secret scanning). |
| C3 | 20 Nov | CUI categorization confirmed | B | Also answers Azure plan D-09. |
| C4 | 18 Dec | Hosting platform selected | B | Azure plan gates G1–G5 start from here. |
| C5 | — | Items 100 / 107: the Azure web build | B (security team, hosting) | Send the Azure plan's document 6 (22 decisions; D-01, D-03, D-04, D-07, D-09, D-10 first). Drafts are outside git; nothing is built without separate authorization. |

### C. Design questions still open (`NEXT-VERSION.md` › Open)

| # | Question | Where | Note |
|---|---|---|---|
| D1 | Shared side lists' read-merge-write window | Item 71 | D4 (v2.02) closed it for execution data. Brad, 6 Oct: per-writer files first, then SharePoint eTags. Needs a design. |
| D2 | Two people sharing different cost estimates under one name at once | Item 63 | Brad: stays, with the fingerprint protection. |
| D3 | Item 82's remaining points (kept cycle fixes its services; pre-service-change journal entries; side lists' unsaved state lasts one session; items 77–79 untested with real File System Access) | Item 82 | — |
| D4 | Older versions reading v1.98+ files; kept cycle's CLIN pointers; Classify grid RCN/EEIC | Item 84 | D6a now refuses a newer file outright. |
| D5 | U14's open questions; U28 (c1) | Ledger | U28 did not reproduce on `981a334`: close it, or find a reproduction. |
| D6 | **Housekeeping:** items 89 and 101 are built (v2.02) but still listed under Open | `NEXT-VERSION.md` | Move them to Shipped › v2.02 in the next commit that touches the file. |
| D7 | Item 20's registry is a first slice | Item 20 | Move other field labels onto `REQ_FIELD` as they are touched; never a big-bang rewrite. |

`NEXT-VERSION.md` › Later: 106 (harden the file while the pilot runs; Brad: not required for the desktop).

### D. The ledger's other open rows

Check each against `main` before working it. The list is in `recovery/v202/HANDOFF.md` section 4.E, less what v2.02
closed (U9, U19H, U24, U29, U31, U43, U47, U51, U52, U53, U60, U62, U72). v2.03 closed no ledger rows.

### E. Carried limit

**layout-fits D:** the first requirement is not on screen as the board opens, at 8 sizes. Brad carried it from v2.00.

### F. Nothing in flight

- No background job, sweep, agent or open PR on `orbit-board`.
- Nothing is uncommitted. Scratchpad files (the Azure drafts) leave with this session; Brad holds the copies.

## 5. Brad's standing rules (short form; CLAUDE.md wins)

1. No merge, deploy or publish without Brad's go. Draft PRs are fine.
2. The can't-fails are data loss and money.
3. The sweep runs only on Brad's named go. During development `mutate.mjs` is TEXT ONLY (`mkmut.py`, `mcount.py`,
   `python3 -I`). Never `npm run mutate` or `validate:math`; `validate:nightly` any time.
4. Changes ship as one version on "go": log in `NEXT-VERSION.md` first, bump `BUILD` once, push once.
5. Never `playwright install`. Never commit a populated board.
6. Run `audit-import` alone (~16 min). One heavy suite at a time on this machine.
7. Expected values are hand-written literals. A new check fails on the base and passes on the fix.
8. Show only what changed: changed lines or a unified diff, never a whole file (21 Oct).
9. OCIO and Azure deliverables are CUI and never go into git; the OCIO response does not mention AI tools.
10. Commits end with the session's attribution lines; GitHub comments end with the Claude Code footer; no model name in
    anything pushed.

## 6. Lessons from v2.03

| What happened | Rule for next time |
|---|---|
| Counting references found no dead code: every function was named somewhere, often only in a comment or by another dead function. | Find dead code with a call graph from the top-level code and the markup's handlers (acorn), not with a name count. |
| Two browser checks failed on `main` for a whole version unseen, because `verify:grid` stops at `layout`. | Run `keys`, `dropdowns`, `dialogs`, `leftmenu`, `standards` by hand after menu or export changes (A4). |
| The pop-up titles read the field registry once at load, so a runtime rename did not reach them. | A registry read must be a getter or a call at draw time; the rename test catches it. |
| A proposal-gate test renamed a field the fixture already filled, so it proved nothing. | Pick the fixture value that makes the rule matter, and assert the fixture has it. |
| A focus-block script cut two blocks when its window held both. | Cut by a unique header, and check the block count of the cut. |

## 7. How to pick up (a new Claude session)

1. Set up access (section 3); `git fetch --unshallow origin` if the clone is shallow.
2. Read `CLAUDE.md`, `AGENTS.md` and this file.
3. Confirm `git log -1 origin/main` is `065bc0d` or later. Branch from `main`.
4. `npm ci`, then `npm run check`. Then
   `python3 -I recovery/v200/bin/mcount.py tools/export-audit/mutate.mjs prioritization-board-grid.html`
   -- expect 2,095 entries, each once -- then `git checkout -- recovery/v200/bin/__pycache__/`.
5. `list_triggers` against section 3. Read the latest nightly math report (A2).
6. Ask Brad, in this order: the sweep go (A1); a release tag for v2.03 (B0); which design question comes first (4.C);
   whether the Azure plan's decisions went to the security team (C5).

**Commands**
- Suites: `node tools/export-audit/<suite>.mjs`. Run `audit-import` alone.
- Browser checks: `npm run verify:grid`, then `keys`, `dropdowns`, `dialogs`, `leftmenu`, `standards` separately.
- The gate without the sweep: `npm run validate:nightly` (~40–55 min).
- A mutant: `python3 -I recovery/v200/bin/mkmut.py tools/export-audit/mutate.mjs <board> <id> <out.html>`.
- The sweep (on Brad's go only): `node tools/export-audit/sweep-shards.mjs --ids FILE [--out DIR] [--jobs N]`.
