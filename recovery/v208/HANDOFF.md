# ORBIT: handoff for v2.08

**Written** 25 Oct 2026, about 8 PM Eastern, the evening v2.07 merged, by the v2.07 lead (Claude, session
`session_014mJNv6BPPuvFvfY5dqYCz4`), for Brad and whoever picks up v2.08: a new Claude session, Codex, or Brad.

**Where it is:** `recovery/v208/HANDOFF.md` on branch `ccr-ce1f5388-a75g07`, draft PR #25. Beside it:
`ITEM-122-BRIEF.md` (the design brief for v2.08's one queued item), `repro/found-on-main.mjs` (four defects found while
writing this, reproduced), and `bin/prove.py` + `bin/slim.py` + `v207-proofs.json` (how v2.07's mutations were proved
without a sweep). **It changes nothing in the board.**

**How it was made:** five read-only agents (carried-over actions, the open queue and the ledger, test debt, item 122,
lessons), each followed by a skeptic that re-checked every claim against the repository; the defects in §4 were then
reproduced in jsdom. Everything below is on `main` at `f508fdb` unless it says otherwise. Times are Eastern unless marked UTC.

---

## 0. Read this first

1. **v2.07 is on `main`**: `f508fdb`, the squash of PR #24, merged 25 Oct at 6:24 PM. `BUILD='v2.07 (25 Oct 2026)'`.
   Branch v2.08 from `main`.
2. **This handoff carries forward everything still open from the last three**, which were never merged: v2.03 (PR #17),
   v2.04 (PR #19) and v2.05 (PR #21). You do not need to read them. PR #15 is an older draft of the v2.02 handoff that
   `main` already holds in a later form.
3. **Read `CLAUDE.md` and `AGENTS.md` before anything else.** Their rules win, but several of their *numbers* are stale
   (§6, C3 and C5). Until those are fixed, trust `package.json`, `mcount.py` and `wc` over the prose.
4. **Before acting on a PR, read its state** (`pull_request_read get`) and check `merged`.
5. **No nightly run has checked v2.06 or v2.07.** The 25 Oct run fired at 07:00 UTC, before v2.06 merged at 11:36 UTC. The
   first on v2.07 is **26 Oct, 07:00 UTC** (3 AM Eastern). Read it first (§6, A1).
6. **Nothing in the board changes until Brad says go.** Item 122 needs his decisions before anything is built
   (`ITEM-122-BRIEF.md` §3). Four defects found today (§4) need his go too.
7. **Clone with full history and a big heap.** `git fetch --unshallow origin` if `git rev-parse --is-shallow-repository`
   says true (recon and import read old boards from history). Run recon and import with
   `NODE_OPTIONS="$NODE_OPTIONS --max-old-space-size=8192"`: they die at this container's 2 GB default.
8. **Anything kept only in a session's scratchpad is lost when the session ends.** Send deliverables to Brad as they exist.

## 1. Where things stand (25 Oct, 8 PM)

| Thing | State |
|---|---|
| `main` | **v2.07**, `f508fdb`. Board 35,029 lines, 2,461,036 bytes. `npm run check` passes. |
| v2.07's own proof (25 Oct, final tree) | `check`, boot-same, every suite, every browser check (layout fails only the carried D ×8; its M passes), `standards` nothing new, defect register 13 defects / 43 guards, money coverage 24/24, money map 301 cells: 108 proven, 192 n/a, 1 open, trace matrix holds, fuzz seed 678881496, file verifier self-test. 154 new mutations, each run against its own block and caught. |
| Mutation targets | 2,317, each matching exactly once (`mcount.py`). |
| Mutation sweep | **Not run since v1.99** (§6, A2). |
| Nightly validation | Last on v2.05 (`db41c0a`, 25 Oct 07:00 UTC): only the carried D ×8 failed. **Never on v2.00, v2.03, v2.06 or v2.07.** |
| Open PRs | #25 (this, draft); #15, #17, #19, #21 (old handoff drafts, superseded by this; Brad: close them?). |
| Branches | `ccr-ce1f5388-a75g07` is this one, restarted from `main` after #24 merged. `claude/security-review-kit` holds one commit not in `main`: `b6f1ffc`, 7 Oct, a review kit for v1.99 (tools and a reviewer's guide; Brad: keep, merge or drop?). The other `ccr-*` and `claude/orbit-v1.9x` branches are history (squash-merged). |
| `orbit-review-mcp` | Untouched since `acbeb7e` (10 Oct). Its README says deployment and client installation are still pending. Nothing open for v2.08. |
| Item 122 (the queued item) | Logged 24 Oct, not designed. The brief is ready (`ITEM-122-BRIEF.md`). |

## 2. Access and permissions

A new session does not inherit this one's access. Items marked **Brad** only Brad can do.

| # | Access | How | Check |
|---|---|---|---|
| P1 | `bradludington-ui/orbit-board`, push | Start in the environment below with the repository attached, or `add_repo` (access `push`). By the current name: the old `spmt-prioritization-board` is refused. | `git push --dry-run` |
| P2 | `bradludington-ui/orbit-review-mcp` | Attached the same way, if needed. | `git ls-remote` |
| P3 | GitHub API | The `mcp__github__*` tools (ToolSearch). No `gh`. If refused, **Brad** reconnects GitHub or installs the Claude GitHub App. | `pull_request_read` on #24 shows `merged: true` |
| P4 | Environment | "Sustainment Portfolio Management Tool" (`env_01TABfDTVRXVJvQvBaTXZ64y`): 4 cores, 15 GB, Chromium at `/opt/pw-browsers`, Node 22, Python 3.13. WebSearch works; WebFetch and curl to outside hosts are blocked. | `nproc`, `free -g` |
| P5 | Permission mode | v2.07 ran in **auto**, draft PRs created automatically. | — |
| P6 | Routines | Brad's account; any session can `list_triggers` / `update_trigger`. Their *attached* repository is still the pre-rename URL (they clone to `/home/user/spmt-prioritization-board` through GitHub's redirect); only **Brad** can change that, in the Routine editor. Harmless. | §3 |
| P7 | Codex | Reaches the repository through Brad's own setup. State unknown since 21 Oct (Brad, 21 Oct: "Don't rely on codex" for E2). Ask for diffs **inline**. | Brad |
| P8 | Files outside git | The OCIO evidence package and POA&M PDF, the Azure plan drafts (CUI). **Brad** holds them. | — |
| P9 | Repository settings | **Brad** only; the proxy refuses settings writes. `main` is unprotected today (§6, E). | — |

## 3. Routines (`list_triggers`, 25 Oct, 11 PM UTC)

| Routine | When | State | What to know |
|---|---|---|---|
| Nightly ORBIT math validation (no sweep): `trig_01MNk6Db7rBPGhnxChGUXkMu` | 07:00 UTC daily | enabled | Runs `npm run validate:nightly` on `main`. It "fails" every night on the carried layout D ×8; read past that line. Its prompt still says "2,021 targets" (2,317 now). Next: 26 Oct 07:01 UTC, the first on v2.07. |
| Nightly ORBIT data-loss fuzz: `trig_01RAstTxNdkTfJYrZrA2dJyv` | 09:00 UTC daily | enabled | `npm run fuzz -- --rounds 12`. 25 Oct on `db41c0a`: 12 rounds clean, seed 601635815. |
| Weekly ORBIT Interface Review: `trig_01DuixcCjkGaHDJw6JtTCK5o` | Mondays 08:00 UTC | enabled | `npm run standards` (the gate), the census, shots, a market scan. **Last ran 19 Oct, before v2.00 merged**: the 26 Oct run is its first on the left-menu board. CLAUDE.md still calls it a daily, weekday-rotating review; it is weekly, rotated by ISO week. |
| v2.00 overnight check-in (hourly): `trig_01PhhHK97YTPeEsCZr3X2fvw` | — | disabled | Obsolete. Brad may delete it. |

Brad's family Routines ("Ludington Around Town research", "Ludington Family calendar sync") are listed too. Leave them alone.

**Read a run's report from its session, not from the trigger.** `last_run.finished_at` is the end of the run's first turn
(it starts a detached job). The report comes in a later turn: `list_events(<last_run.session_id>, kinds: ["result"])`.

## 4. Found while writing this: four defects on `main`, all older than v2.07

None is logged in `NEXT-VERSION.md` yet; log them on Brad's word (items 123–126 are free). Each is reproduced by
`node recovery/v208/repro/found-on-main.mjs`, which prints PRESENT or GONE and changes nothing. Details and proposed
fixes are in `ITEM-122-BRIEF.md` §5.

| # | What happens | Severity |
|---|---|---|
| F1 | **Clearing a requirement's decision band deletes its impact statement.** A statement over 300 characters cannot be put back from the journal. Since the first commit; no check covers it. | data loss |
| F2 | **Typing in the ⚠ Impact statement or 📄 Description & note pop-up is replaced by the stored text on any redraw**, and with Live view on in shared-folder mode every tick redraws (at least every 10 s, by default 30). The redraw is measured; the tick is read from the code. | data loss, while Live view is on |
| F3 | **Setting a requirement's office to the office it is already in moves it to the bottom of that office's ranking**, unjournalled; Classify's bulk PMO set does it to every row already there. | silent re-ranking |
| F4 | **A requirement switched from a government activity to a prime keeps the old "Which awards to" and MIPR type**, hidden, and the funds flow by final destination files the prime's money under the old second hop. | money under the wrong destination |

Two older data-loss rows from the v2.00 ledger are also still open and are **P1** by their finder: **U63** (a Live
refresh loads a folder copy over work saved only in the board file, and the next Save writes over it unasked) and **U64**
(the folder's Put this back does the same). v2.02's `loadCounted` covered four other routes, not `driveStorePull` or
`driveRestore`. Neither has a proposed fix on record.

## 5. Item 122: edit the whole record in one box

v2.08's one queued item, logged 24 Oct (*"Edit the whole record later as its own item"*). `ITEM-122-BRIEF.md` holds
the groundwork:
- §1–2: a field-by-field map of the six surfaces that edit a record today (the Classify grid among them);
- §3: eleven decisions for Brad, each with options and a recommended answer;
- §4: what carries over from the Add box (`reqNeeds`, `reqDraftOf`, draw-once, the CCaR description rule) and what
  does not (`reqCreate` must not be the edit writer);
- §5: the four defects above;
- §6: the collisions (triage rule, `npm run controls`, box controller, journal, PMO copy, pinned checks and mutations);
- §7: a test plan.

The short form of the recommendation: one box that replaces 📋 Requirement edit and both written-field pop-ups, opened
from the RECORD panel's three buttons, holding the record fields but not the money. It keeps a held draft and writes only
what changed in one save. It warns rather than blocks on required fields, and an office change asks first and names its
side effects. Every one of those is Brad's call.

## 6. Tracker: every open action

Owner: **C** = the Claude lead, **B** = Brad, **S** = the security team. "Ledger" = `recovery/v200/UNRESOLVED-LEDGER.md`
on `main`; **it has not been updated since 19 Oct**, so `NEXT-VERSION.md` and the commits are the record of what closed.

### A. Verification (first)

| # | Action | Owner | Next step |
|---|---|---|---|
| A1 | Read the 26 Oct 07:00 UTC nightly (the first on v2.07), the 09:00 fuzz, and the 08:00 Interface Review (the first `standards` gate since v2.00 merged). | C | Anything other than the 8 D results is real: log it. |
| A2 | **The mutation sweep.** Last: v1.99, 7 Oct, 1,139 targets (1,128 caught, 11 equivalent); a v2.00 candidate swept 1,150 on 8 Oct; a 20-target pilot on 20 Oct. About **1,300 of today's 2,317 entries have never been swept as they are now written** (1,247 ids added since v1.99, by prefix: `v200` 870, `v201` 2, `v202` 89, `v203` 16, `v204` 46, `v205` 15, `v206` 55, `v207` 154; plus 62 retargeted). Planned for "after the 24 Oct reset"; no go recorded. | B (named go), C | Ask for the go on the v2.00+ subset first (Brad, 20 Oct), then everything. Use `tools/export-audit/sweep-shards.mjs`, **not** `validate:math`: its sweep stage is the old runner, whose 2.5 GB cap CRASHED big recon and import blocks. Recalibrate first (`--calibrate-only`; the calibration hash covers the tools, which changed). A fresh container has no catcher history (`.math-reports/` is ignored). Projected from the 20 Oct pilot's rate (about 4 minutes a target, 4 jobs; a projection, not a measurement): about 87 hours for the unswept 1,300, about 154 for all. Saved batches, a committed tree, nothing else running, one watcher. A SURVIVED target gets a check, never a deleted mutation. |
| A3 | **The real environment, never tried.** Exports opened in Excel (only LibreOffice and XML parsers so far, including v2.04's house style and the five-year chart); the Spend Plan Source in CCaR; the IDS batch import; the 1A9A with the comptroller; Windows and Edge (Segoe UI is only stood in for); the File System Access save, the IndexedDB handle and the Web Lock on real machines; the CSP on Edge from a `file://` share; the shared folder on real SharePoint/OneDrive sync with two writers; the Windows launcher sidecar. Brad's photos of the work machine are the only real-environment evidence, and they found defects (items 114–120). | B, C | C writes a one-page checklist; one session with Brad at a work machine; the result logged as an item. |
| A4 | **No independent review of v2.04 or v2.05 is recorded.** v2.04 removed three network transports, added the CSP, added `aiImport` through `inboundCheck`, and rebuilt the five-year workbook. | C | One review scoped to data loss, the import door and the five-year workbook's figures against `fydpData`. |
| A5 | v2.06 after its review fixes (`3a37796`) had no full run recorded before its merge; v2.07's final-tree run covers that code. `NEXT-VERSION.md` notes a locked cycle keeping `it.prior` links was not tested on its own. | C | Optional: one check that a lock keeps the links. |

### B. Decisions waiting on Brad

| # | Decision | Where | Recommend |
|---|---|---|---|
| B1 | Item 122's eleven decisions | `ITEM-122-BRIEF.md` §3 | As recommended there |
| B2 | Log and fix F1–F4 (§4) | §4 | F1 and F2 in v2.08 (data loss; F2 shapes item 122's design), F3 and F4 with them |
| B3 | U63 and U64 (P1 data loss, §4) | Ledger | Propose fixes (keep the work aside by U19's rule) for v2.08 |
| B4 | Item 112's five build choices, never put to him: "Allocated" prints the lane draw (keep it and rename the column Funded, or add the allocation as its own column?); a held year with nothing prints 0.000 where the log said –; the PMO tabs file a requirement under its own office, not split by CLIN share; wide sheets are not fitted to one page wide; the Priority Drill can show `###` in narrow columns under the house style | `NEXT-VERSION.md` v2.04 | One short list with a recommendation each |
| B5 | The sweep go | A2 | v2.00+ subset first |
| B6 | Ledger rows needing a decision: U5, U6, U16, U19H's fuller header wording, U21, U22, U23, U25, U27 (re-measure first), U35, U38, U39, U45, U54, U55, U65, U66, U67, U70, U8, U48, U7; UI-m1, m2, m4 (re-check first) | Ledger | Put them as one list grouped by area; most are wording or one-line fixes |
| B7 | Item 71's remainder: the shared side-list write window (per-writer files and SharePoint eTags were his 6 Oct direction; SharePoint is gone since v2.04), and the launcher sidecar (test it, or retire it) | `NEXT-VERSION.md` 71 | Fold the window into the Azure build (107); ask whether any office uses the launcher |
| B8 | Item 84's RCN-EEIC ask column for a split prime (v2.02 D6b added a note; his 6 Oct "stays for review") | 84 | Ask whether the note closes it |
| B9 | Item 82's 6 Oct review asks for his rule before the funds-flow and ACE totals are called certified; v1.99's worked examples exist | 82 | Ask whether they meet it |
| B10 | `setAbsorber` is not refused in a PMO copy; Classify's bulk Prime/OGC and cost-element setters write with no check | `ITEM-122-BRIEF.md` §5 | Fix with item 122 |
| B11 | Close PRs #15, #17, #19, #21 (superseded by this handoff); `claude/security-review-kit` (`b6f1ffc`) | §1 | Close all four; ask about the kit |
| B12 | Is v2.07 where people open the board? A release tag? (No tag exists.) | — | — |
| B13 | Item 109: confirm with the security team that board data may go to GenAI.mil (its banner says IL5, CUI and PII). Not tracked anywhere since v2.04. | `NEXT-VERSION.md` v2.04 | Track it with the other security questions (E) |
| B14 | Item 117's follow-up: a trend report that follows the year-to-year links. v2.06 said it "can be logged as its own item once the link is in place"; the link shipped. | `NEXT-VERSION.md` v2.06 | Log it if he wants it |
| B15 | BACKLOG entry 8: is a diff of PPBE positions in the cycle comparison wanted? Its other three open decisions were settled by the builds. | `BACKLOG.md` | — |

### C. Docs and tools (no board change, so no go; show Brad the diff, one commit each)

| # | What | Fix |
|---|---|---|
| C1 | `verify:grid` stops at `layout` (whose carried D ×8 always fails), so `keys`, `dropdowns`, `dialogs` and `leftmenu` never run in it or at night, and `standards` is not in the chain at all. Two checks failed unseen for a whole version this way (v2.02). | Run those five before `layout`, or have `layout` exempt D by name. Until then, run them by hand after any change to menus, exports or boxes. |
| C2 | `validate-math.mjs` and `audit:suites` set no heap; recon and import die at 2 GB here. The 25 Oct nightly passed without it, so a pass depends on the container. | Set `--max-old-space-size=8192` for those two inside the runner, appended to `NODE_OPTIONS`. |
| C3 | `money-coverage.mjs` reads only single-quoted mutation ids (1,216 of 2,317 are double-quoted) and only quoted finds (38 template, 2 `String.raw` and 5 named-constant finds are skipped); `math-defects.mjs` reads single-quoted guards only. It can under-report, never falsely pass. | Read entries the way `mut-json.py`/`mcread.py` do; prove it on a planted double-quoted id; re-run both. Never rewrite the ids. |
| C4 | One open money-map cell: `aiExport` × Fiscal year (the check holds only the year on screen, on a one-year fixture). | A second held year in audit-recon's item 109 block, or n/a with a reason. |
| C5 | Stale numbers. `CLAUDE.md`: "~130 min, two sweeps of 250", "both builds", "parity", "six banners" and "12 banners" (the healthy count is 8 banners plus the legacy line, plus boot-same), the `audit-ppt` cost row, `exportPPT` in the audit description, "2,021 targets", the daily Interface Review, the v1.97-era money-map figures, "ids are single-quoted", and no forward note that v2.02 E6 ran the reviews v2.00's gate skipped. `AGENTS.md`: "~26,700 lines", "7 banners", "verify:grid exit 0", "2,021". `README.md`: line count, the 📁 File menu, PowerPoint, Confluence and SharePoint. `WORK-ASSIGNMENTS.md`: still the v2.00 assignment. The nightly Routine's prompt: "2,021 targets". | One docs pass; the Routine prompt updated only with Brad's OK. |
| C6 | `CLAUDE.md`'s *Before every commit* should say: unshallow, the 8 GB heap for recon and import, and `python3 -I -B` for `mkmut.py` (plain `-I` rewrites the tracked `recovery/v200/bin/__pycache__/mcread.cpython-313.pyc`). | Three lines. |
| C7 | `NEXT-VERSION.md` › Open items 63, 71, 82 and 84 were never updated for v1.99's items 92–97 or v2.02's D3–D6 builds, so about half their bullets are done. Later › 106 still lists the CSP and Clear this computer, shipped in v2.04. "485 planted mistakes" (2,317). The 29 Sep card-era note (removed in v2.03). The bare `GATE_V200` line in the v2.00 section. | Strike each done bullet with the item that closed it. |
| C8 | The ledger: record what closed since 19 Oct. Closed but unrecorded: U9, U9L, U14, U15, U24, U28, U29, U31, U43, U47, U51, U52, U53, U60, U62, U72; fixed and still marked "closed when the lead integrates": U41, U56–U59; U17 probably closed (by inference); UI-MENU overtaken by v2.05. Still open: §6 B3 and B6 above, U18's and U61's residuals, U69 and U40's named limit (re-measure: item 89 may have narrowed both for locks from v2.02), U11 (its `driveRpPush` part is gone), U12. | One ledger commit. |
| C9 | `BACKLOG.md` entries 1 and 3 name `addReq` and `rowChipsHtml` (both gone); entry 9 was superseded by item 112. | Mark them. |
| C10 | Test gaps: `standards` opens 5 of the 48 boxes (item 71); `dropdowns-visible` scrolls every item into view, so a menu that cannot scroll passes, and its docked pass runs only at 1536 and 1920; `hostile.mjs` opens the pop-up with retired kinds, so the 📄 pop-up is never swept; nothing counts mutation targets at night (`mcount.py` by hand only). | Tools changes, each proved on a planted fault. |
| C11 | `recovery/v200/bin`'s shell runners name `audit-ppt` and some push to the v2.00 backup branch. | Use only `mkmut.py`, `mcount.py`, `mcread.py` from there. |

### D. Carried limit

**layout-fits D ×8**: the first requirement is not on screen as the board opens, at 1920, 1440, 1366 and 1024, docked and
sliding over. Brad carried it from v2.00. Any other browser failure is real.

### E. OCIO and security (Brad, the security team)

| # | Date | What | Owner |
|---|---|---|---|
| E1 | 6 Nov | Evidence package to OCIO (stays at `f616daa`); repository hardened. `main` shows `protected: false`. C writes the one-page list (branch protection, required review, signed commits, secret scanning and push protection, Dependabot alerts); Brad applies it. | B, C |
| E2 | 20 Nov | CUI categorization confirmed. | B |
| E3 | 18 Dec | Hosting platform selected; items 107 (Azure build, draft plan outside git) and 100 (IL5, Zero Trust) follow. | B |
| E4 | — | Questions for the security team, none answered on record: GenAI.mil for this data (B13); CUI marking wording and places (Brad, 22 Oct: classification marks stay off the workbooks for now); the 15 deployment questions and the plan's 8; which IL5 controls are inherited; the Zero Trust target; the hosting date. Whether the Azure plan's decision list was sent is unknown. | B, S |
| E5 | — | Item 106's remainder (Later; Brad: not required for the desktop file): SHA-256 fingerprints, a hash-chained journal, CUI markings, a static-analysis scan with `npm audit`, a user-facing list of what ORBIT leaves on a machine. | B (go again) |

### F. Nothing in flight

No background job, sweep, agent or Routine change is running. Nothing is uncommitted. PR #25 is a draft. The scratchpad
(the gathered evidence behind this file, the repro scratch, v2.07's mock-ups) leaves with this session.

## 7. Brad's standing rules (short form; `CLAUDE.md` and `AGENTS.md` win)

1. No merge, deploy or publish without Brad's go. Draft PRs are fine. Never force-push a shared branch.
2. The can't-fails are data loss and money. Every word on screen must stay true.
3. The sweep runs only on his **named** go. During development `mutate.mjs` is **text only**: `mkmut.py`, `mcount.py`,
   `prove.py`, with `python3 -I -B`. Never import it; never `npm run mutate` or `validate:math`. `validate:nightly` any
   time.
4. Changes ship as one version on "go": logged in `NEXT-VERSION.md` first, `BUILD` bumped once, pushed once.
5. Never `playwright install`. Never commit a populated board.
6. One heavy suite at a time on this machine; `audit-import` alone (about 14–16 minutes).
7. Expected values are hand-written literals. A new check fails on the base (or its mutant) and passes on the fix.
8. Show only what changed: changed lines or a unified diff, never a whole file (21 Oct).
9. OCIO and Azure deliverables are CUI and never go into git; the OCIO response does not mention AI tools.
10. Ask with AskUserQuestion only while background work runs: it holds the turn until he answers.
11. Commits end with the attribution lines the session's own system gives; GitHub comments end with the Claude Code
    footer; no model name in anything pushed beyond those lines.

## 8. Lessons from v2.06 and v2.07

| What happened | Rule for next time |
|---|---|
| v2.07 passed every suite and browser check, and then two independent reviews (reviewers by area, each finding re-run by a skeptic trying to refute it) confirmed 16 and then 12 defects; writing the fixes' own checks found 3 more. v2.06's reviews found 17. | Budget for it: build, review with skeptics, a check and a mutation per fix, then a second review of the fixes, before asking for the merge. |
| Chromium fires `change` on every arrow key of a closed `<select>`, so the Add box's office question locked the first office on the first ArrowDown. jsdom does not do it unless the test dispatches it. | Never commit a choice on a keyboard-reachable select's `change`: Enter chooses. Prove it with `npm run keys`. |
| Playwright dismisses a `confirm()` by default, so layout M and standards failed once the Add box asked before replacing typing. | A browser tool that drives a path with a question answers it explicitly. |
| `budParseName` built a RegExp from a raw office name (`C++` stopped the board drawing); a BAE entry with no date and an estimate with no totals each stopped every redraw. | Escape every name before `new RegExp`; a draw function tolerates any stored shape; run the hostile sweep after touching a panel. |
| `budReg()`'s cache was not keyed on the offices, so an office added in Setup had no budgets until a reload. | A memo is keyed on everything it reads. |
| `reqNewId` minted `NEW-Brad's-1`, which the import door refuses, and the whole submittal went with it. | Anything the board mints passes its own door; test with an apostrophe in an office name. |
| The fixes of the first review introduced two defects of their own (the status line read the year off the wrong requirement; an office starting with punctuation stopped matching), found by the agents writing their checks. | A fix is not done until its own check has gone red on the base and green on the fix. |
| A fixture that bumped `newSeq` shifted ids that later checks in the same board expected. | A check that changes shared state goes last in its board, or gets its own. |
| `python3 -I` still writes bytecode: every `mkmut.py` run rewrote a tracked `.pyc`. | `python3 -I -B`. |
| `.gitignore` takes every `*.json`, so `v207-proofs.json` was silently left out of the commit that said it kept it (caught by this handoff's skeptic). | `git show --stat` after every commit; `git check-ignore -v` before committing a new `.json`. |
| `slim.py`'s "kept N" counted helper blocks, so a misspelt scenario name kept nothing, ran nothing, and would have read SURVIVED (caught by the skeptic). | Fixed: a name that matches no scenario is refused. A tool that judges must be able to fail; prove it does. |
| `pkill -f` matched the shell running it (exit 144). | End only processes whose PIDs you recorded. |
| Four defects in §4 were found by reading code for item 122; each looked plausible, and one (the Live tick) could have been wrong. | Before reporting a code-reading finding as a defect, reproduce it in a few lines of jsdom and keep the script. |
| A Routine's `finished_at` read as a 40-second run; the report came half an hour later in a second turn. | Read the run's session result, not the trigger. |
| The last three handoffs were never merged, so a session branching from `main` never saw their trackers, and their open items went unworked for three versions. | Merge the handoff (records only) or point to it from `main`. |

The older lessons, all still true, are in `recovery/v202/HANDOFF.md` §6 and in `CLAUDE.md`'s version sections: run
`mcount.py` after every board change and merge; grep the suites for any wording you change; declare a `let` that
`syncBtns` or `render` reads beside `let MS`; read exports' bytes with a real XML parser; check a PR's `merged` before
pushing to it.

## 9. How to pick up (a new Claude session)

1. Access (§2). `git fetch --unshallow origin` if shallow.
2. Read `CLAUDE.md`, `AGENTS.md`, this file and `ITEM-122-BRIEF.md`.
3. `git log -1 origin/main`: `f508fdb` or later. Branch from `main`. If PR #25 is merged, the `recovery/v208` tools are
   on `main`; if not, bring them over (`git checkout origin/ccr-ce1f5388-a75g07 -- recovery/v208`).
4. `npm ci`, `npm run check`, then
   `python3 -I -B recovery/v200/bin/mcount.py tools/export-audit/mutate.mjs prioritization-board-grid.html` (expect 2,317,
   each once) and `node recovery/v208/repro/found-on-main.mjs` (expect four PRESENT until fixed).
5. `list_triggers` against §3; read the nightly, fuzz and Interface Review reports (A1).
6. Ask Brad, in one batch: item 122's decisions (B1), F1–F4 and U63/U64 (B2, B3), the sweep go (A2), a date for the
   real-environment session (A3), item 112's questions (B4), the old PRs (B11).
7. While waiting: §6 C, one commit each, each shown to Brad as a diff.

**Commands**
- One suite: `node tools/export-audit/<suite>.mjs`; recon and import with
  `NODE_OPTIONS="$NODE_OPTIONS --max-old-space-size=8192"`, alone.
- Browser checks: `npm run verify:grid`, then `keys`, `dropdowns`, `dialogs`, `leftmenu` and `standards` one at a time.
- The gate without the sweep: `npm run validate:nightly` (about 30–55 minutes).
- One mutant: `python3 -I -B recovery/v200/bin/mkmut.py tools/export-audit/mutate.mjs prioritization-board-grid.html <id> <out.html>`.
- Each mutation against its own check: `python3 -I -B recovery/v208/bin/prove.py IDS.json OUT.jsonl [ids]` from the
  repository root, with `IDS.json` a list of `{id, caughtBy: "<suite> / <scenario name substring>"}` (v2.07's are in
  `recovery/v208/v207-proofs.json`). `JOBS` × `HEAP` within about 12 GB.
- A suite cut to some scenarios: `python3 -I -B recovery/v208/bin/slim.py <suite> tools/export-audit/_slim-x.mjs "<name>"`.
- Money map, read-only: `node tools/money-map.mjs --check` (`npm run money-map` rewrites `money-map.md`).

## 10. A suggested order for v2.08 (a proposal; nothing in it is approved)

1. A1: read the first nightly, fuzz and review on v2.07.
2. One batch of questions to Brad (§9, step 6).
3. §6 C as small reviewed commits (docs and tools only).
4. On his go: item 122 with F1–F4 (F2 shapes the box), and U63/U64 if he chooses. Then two rounds of review with
   skeptics, each mutation proved with `prove.py`, and a `validate:nightly` on the final tree.
5. The sweep, on his named go, in saved batches (A2).
6. The real-environment session (A3), and an independent review of v2.04/v2.05 (A4).
