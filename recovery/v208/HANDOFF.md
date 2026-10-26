# ORBIT: handoff for v2.08

**Written** 25–26 Oct 2026, the evening v2.07 merged, by the v2.07 lead (Claude, session
`session_014mJNv6BPPuvFvfY5dqYCz4`), for Brad and whoever picks up v2.08: a new Claude session, Codex, or Brad.

**Where it is:** `recovery/v208/HANDOFF.md` on branch `ccr-ce1f5388-a75g07`, draft PR #25. Beside it:
`ITEM-122-BRIEF.md` (the design brief for v2.08's one queued item), `repro/found-on-main.mjs` (seven defects found while
writing this, reproduced), and `bin/prove.py` + `bin/slim.py` + `v207-proofs.json` (how v2.07's mutations were proved
without a sweep; `prove.py` now runs each check on the unmutated board first, and every check v2.07's were proved
against passes it). The branch also adds three `.gitignore` lines (keep `v207-proofs.json`; ignore the provers'
`_slim-prove-*` and `_shard-*` copies). **It changes nothing in the board.**

**How it was made:** five read-only agents gathered the facts (carried-over actions, the open queue and the ledger, test
debt, item 122, lessons), each followed by a skeptic that re-checked every claim against the repository. Then ten more
agents checked the draft of this file and of the brief claim by claim (139 corrections, all applied), and a last one looked
for what was still missing. Behaviours were tested in jsdom, not taken from reading. Everything below is on `main` at
`f508fdb` unless it says otherwise. Times are Eastern unless marked UTC.

---

## 0. Read this first

1. **v2.07 is on `main`**: `f508fdb`, the squash of PR #24, merged 25 Oct at 6:24 PM. `BUILD='v2.07 (25 Oct 2026)'`.
   Branch v2.08 from `main`.
2. **This carries forward what is still open from the last three handoffs**, which were never merged: v2.03 (PR #17),
   v2.04 (PR #19) and v2.05 (PR #21), checked item by item. PR #15 is an older draft of the v2.02 handoff that `main`
   already holds in a later form.
3. **Read `CLAUDE.md`, `AGENTS.md` and `WORK-ASSIGNMENTS.md` before anything else.** Their rules win where they speak, but
   several of their *numbers* are stale (§6, C5), and `WORK-ASSIGNMENTS.md` still holds the v2.00 assignment: **make no edit
   until Brad names the v2.08 owner and scope.** Until the numbers are fixed, trust `package.json`, `mcount.py` and `wc`
   over the prose.
4. **Before acting on a PR, read its state** with `pull_request_read get` (or `gh api …/pulls/<n>`) and check `merged`.
   `list_pull_requests` shows `merged: false` even for merged PRs; read `merged_at` there.
5. **No nightly run has checked v2.06 or v2.07.** The 25 Oct run fired at 07:00 UTC, before v2.06 merged at 11:36 UTC. The
   first on v2.07 is **26 Oct, 07:00 UTC** (3 AM Eastern). Read it first (§6, A1), and know that it may outlast its
   watcher (§3).
6. **Nothing in the board changes until Brad says go.** Item 122 needs his decisions before anything is built
   (`ITEM-122-BRIEF.md` §3). The seven defects found here (§4) need his go too.
7. **Clone with full history and a big heap.** `git fetch --unshallow origin` if `git rev-parse --is-shallow-repository`
   says true (recon and import read old boards from history). Run recon and import with
   `NODE_OPTIONS="$NODE_OPTIONS --max-old-space-size=8192"`: they die at this container's 2 GB default.
8. **Anything kept only in a session's scratchpad is lost when the session ends.** Send deliverables to Brad as they exist.

## 1. Where things stand (25 Oct, 9 PM)

| Thing | State |
|---|---|
| `main` | **v2.07**, `f508fdb`. Board 35,029 lines, 2,461,036 bytes. `npm run check` passes. |
| v2.07's own proof | **Re-checked at handoff, on `f508fdb`:** `npm run check`; defect register 13 defects / 43 guards; money coverage 24/24; money map 301 cells: 108 proven, 192 n/a, 1 open; trace matrix 77 cells, every link holds; file verifier self-test; `mcount` 2,317. **From v2.07's record only (25 Oct, final tree):** boot-same, every suite, every browser check (layout fails only the carried D ×8; its M passes), `standards` nothing new, fuzz seed 678881496, and 154 new mutations each run against its own block and CAUGHT (their ids are `v207-proofs.json`; `prove.py`'s output was not kept). **Re-run at handoff:** every one of those checks passes on the unmutated board (`prove.py`'s new clean step, 26 Oct), so none of the 154 catches came from a check that fails anyway; the mutants themselves are being re-run so their verdicts are kept (§6 F). |
| Mutation targets | 2,317, each matching exactly once (`mcount.py`). |
| Mutation sweep | No full sweep since about 8 Oct: v2.00's first candidate `608444e`, 1,150 targets, 1,139 caught, 11 equivalent (superseded: its board had defects). The last sweep of a shipped version: v1.99, 7 Oct. Never on a merged v2.00+ tree; a 20-target pilot ran 20 Oct (§6, A2). |
| Nightly validation | Last on v2.05 (`db41c0a`, 25 Oct 07:00 UTC): only the carried D ×8 failed. **Never on v2.00, v2.03, v2.06 or v2.07.** |
| Open PRs | #25 (this, draft); #15, #17, #19, #21 (old handoff drafts; close them once B12 is done). |
| Branches | `ccr-ce1f5388-a75g07` is this one, restarted from `main` after #24 merged. **Not on `main`, keep read-only:** `claude/security-review-kit` (`b6f1ffc`, 7 Oct, a review kit for v1.99: tools and a reviewer's guide; Brad: keep, merge or drop?); `claude/v200-fixes-wip` (`3fab8ef`, 20 Oct: the v2.00 gate runbook and records CLAUDE.md cites, `build_evidence.sh`, `focus-block.py`); `codex/v200-reports-20261013` and `codex/v200-reports-round2-20261013` (Codex's v2.00 review reports); and the heads of the open handoff PRs #15, #17, #19, #21. The other `ccr-*` and `claude/orbit-v1.9x` branches are merged history. |
| `orbit-review-mcp` | Last commit `acbeb7e` (10 Oct). Its README says deployment is pending, but its deploy workflow succeeded that day (run #5, 21:53 UTC, commit `77ba405` installs an orbit-board token as a Worker secret), so a Cloudflare Worker with a read token for this repository is **probably live**. Its check list still names `audit-ppt.mjs` (removed in v2.05). Brad: keep it running and update it, or take it down and revoke the token (E1). |
| Item 122 (the queued item) | Logged 24 Oct, not designed. The brief is ready for Brad (`ITEM-122-BRIEF.md`). |

## 2. Access and permissions

A new session does not inherit this one's access. Items marked **Brad** only Brad can do.

| # | Access | How | Check |
|---|---|---|---|
| P1 | `bradludington-ui/orbit-board`, push | Start in the environment below with the repository attached, or `add_repo` (access `push`). By the current name: the old `spmt-prioritization-board` is refused. | `git push --dry-run` |
| P2 | `bradludington-ui/orbit-review-mcp` | Attached the same way, if needed. | `git ls-remote` |
| P3 | GitHub API | The `mcp__github__*` tools (ToolSearch), or `gh api repos/bradludington-ui/orbit-board/…`: **REST only**; GraphQL commands such as `gh pr view` are refused with HTTP 403, and `gh auth status` calls the token invalid though REST works. If both are refused, **Brad** reconnects GitHub or installs the Claude GitHub App. | `gh api …/pulls/24 --jq .merged` gives `true` |
| P4 | Environment | "Sustainment Portfolio Management Tool" (`env_01TABfDTVRXVJvQvBaTXZ64y`): 4 cores, 15 GB, Chromium at `/opt/pw-browsers`, Node 22.22, Python 3.13. WebSearch works. WebFetch to outside hosts fails as a DNS error (`getaddrinfo ENOTFOUND`) and curl with `CONNECT tunnel failed, response 403`: both are the network policy, do not retry. | `nproc`, `free -g` |
| P5 | Permission mode | v2.07 ran in **auto**, draft PRs created automatically. | — |
| P6 | Routines | Brad's account; any session can `list_triggers` (`update_trigger` is untested from a session, and changes a Routine only with Brad's OK). Their *attached* repository is still the pre-rename URL (they clone to `/home/user/spmt-prioritization-board` through GitHub's redirect); `update_trigger` has no repository field, so the Routine editor (**Brad**) is the only route known. Harmless. | §3 |
| P7 | Codex | Reaches the repository through Brad's own setup. State unknown since 21 Oct (Brad, 21 Oct: "Don't rely on codex" for E2). Ask for diffs **inline**. | Brad |
| P8 | Files outside git | The OCIO evidence package (zip, built at `f616daa`), the POA&M PDF, their generators `build_pdf.py` and `build_evidence.sh`, and the Azure plan drafts (CUI). **Brad** holds them; a session that needs one asks him to upload it. | — |
| P9 | Repository settings | **Brad** only, by his rule: never change settings from a session, even though the token reports admin. The proxy refused a settings write on 22 Sep (the rename); not re-tested. `main` is unprotected today (§6, E1). | — |

## 3. Routines (`list_triggers`, 25 Oct, 11 PM UTC)

| Routine | When | State | What to know |
|---|---|---|---|
| Nightly ORBIT math validation (no sweep): `trig_01MNk6Db7rBPGhnxChGUXkMu` | 07:00 UTC daily | enabled | Runs `npm run validate:nightly` on `main` from a background job watched by a background watcher. On 25 Oct it failed only on the carried layout D ×8, and **its watcher hit the 30-minute background limit just as the run ended** (about 30 minutes on v2.05). v2.06 and v2.07 add suite blocks, so the 26 Oct run may outlast the watcher: a report that says the run did not finish is not a result, so run `validate:nightly` yourself (A1). With Brad's OK the prompt's watcher gets `timeout: 7200000` (C5). Its prompt still says "2,021 targets" (2,317 now). Next: 26 Oct 07:01 UTC, the first on v2.07. |
| Nightly ORBIT data-loss fuzz: `trig_01RAstTxNdkTfJYrZrA2dJyv` | 09:00 UTC daily | enabled | `npm run fuzz -- --rounds 12`. 25 Oct on `db41c0a`: 12 rounds clean, seed 601635815. |
| Weekly ORBIT Interface Review — layout, menus, market scan: `trig_01DuixcCjkGaHDJw6JtTCK5o` | Mondays 08:00 UTC | enabled | `npm run standards` (its gate), the census, shots, a market scan rotated by ISO week. **Last ran 19 Oct, before v2.00 merged**: the 26 Oct run is its first on the left-menu board. `ia:shots` photographs only the five remaining top dropdowns, not the left menu's boxes or flyouts (only `ia:census` reads those), so its look at the left menu rests on the census and the full-board shot (C10). CLAUDE.md calls it the nightly, weekday-rotating "SPMT Interface Review" (C5). |
| v2.00 overnight check-in (hourly): `trig_01PhhHK97YTPeEsCZr3X2fvw` | — | disabled | Obsolete. Brad may delete it (B16). |

Brad's family Routines ("Ludington Around Town research", "Ludington Family calendar sync") are listed too. Leave them alone.

**Not Routines:** `.agents/monitoring/` defines four read-only reviewers (money and data preservation, hourly on changed PR
heads and `main`; regression, daily about 8 AM; environment acceptance, daily). Their recurring tasks are configured in Brad's
ChatGPT, not here: `list_triggers` cannot see them, whether they still run is unknown (ask Brad), and their reports go to him.
They would review PR #25 and every v2.08 PR head.

**Read a run's report from its session.** `list_events(<last_run.session_id>, kinds: ["result"])` and take the last
result. For the nightly math, which starts a detached job, `last_run.finished_at` is the end of its first turn and the
report comes about half an hour later; the fuzz and the Interface Review report in their first turn.

## 4. Found while writing this: seven defects on `main`, all older than v2.07

None is logged in `NEXT-VERSION.md` yet; log them on Brad's word (items 123 onward are free). Each is reproduced in jsdom by
`node recovery/v208/repro/found-on-main.mjs` (eight checks; it prints PRESENT or GONE and changes nothing). F1–F4 were found
by the item 122 audit, F5–F7 by this handoff's claim-by-claim check. Details and proposed fixes are in `ITEM-122-BRIEF.md` §5.

| # | What happens | Severity |
|---|---|---|
| F1 | **Clearing a requirement's decision band deletes its impact statement.** One whose saved form runs past 300 characters (about 299 typed; quotes and line breaks count extra) is journalled as its size and cannot be put back; a shorter one can. Since the first commit; no check covers it. | data loss |
| F2 | **A redraw replaces typing not yet committed**: in the ⚠ Impact statement and 📄 Description & note pop-ups, and in the RECORD panel's own figures (value by service, Disc/Mand, minimum increment, absorber floor). With Live view on (the shared folder is its only mode since v2.04), every tick redraws, even when the folder cannot be read: every 30 s by default, settable from 10 to 600 s. The redraw is reproduced; the tick was run in jsdom with the folder read stubbed (succeeding and failing), not against a real folder or timer. Same class as ledger **U35** (the RCN/EEIC registry, deferred P2 on 13 Oct). | data loss, while Live view is on |
| F3 | **Setting a requirement's office to the office it is already in moves it to the bottom of that office's ranking**, unjournalled, while the status line says "… is already in <office>". Reached through Classify's bulk PMO set, which re-ranks every row already in the office into the listing order while its confirm calls them "already say exactly this", and in Chromium by arrowing through Requirement edit's PMO select. | silent re-ranking; words untrue |
| F4 | **A requirement switched from a government activity to a prime, or with Goes to cleared, keeps the old "Which awards to" and MIPR type.** Requirement edit stops showing them and nothing can clear them. The 🎯 Priority Drill prints the MIPR type against the prime, a submittal and a year copy carry both, and the funds flow by final destination files the money under the old second hop (measured: $100 under Lockheed Martin by final destination, Pratt & Whitney by first). | money under the wrong destination |
| F5 | **In a PMO copy, renaming the plan event or record name of a requirement the portfolio board added is shown and never sent** (the rename goes to `it.event` / `it.title`; the submittal reads `S.titles` / `S.recNames`). The office is told nothing. | an office's input silently dropped |
| F6 | **In a PMO copy, a prime's CLIN drill is open for editing and none of it is sent** (no `clin*` container is in `PMO_FIELDS`; no lock, no notice). | an office's input silently dropped |
| F7 | **Classify's per-service RCN/EEIC columns (↳ USAF…) share their label with the bulk per-service BAE budget setter**, so a bulk set of "↳ USAF" writes budgets on every row shown, not RCN/EEIC. | a bulk write to the wrong field |

Also confirmed in the code, not run as defects: `setAbsorber` and `setAbsorbFloor` are not refused in a PMO copy (the
absorber is a memo: no lane figure moves, nothing is sent), though the `PMO_FIELDS` comment says `allocLocked` refuses it;
and Classify's bulk Prime/OGC and cost-element entries write their containers directly (values only from fixed lists, so
nothing unchecked is reachable today).

**Two older data-loss rows from the v2.00 ledger are also open** (marked P1 and Open there; not re-measured on `f508fdb`;
since `a4881ec`, the ledger's last check by code, the code involved has changed only its wording; the repro does not cover
them):
- **U63**: a Live refresh (`driveStorePull`) loads a folder copy over work saved only in the board file, keeping nothing
  aside; once Live view is switched back to watching, the next 💾 Save to the board file writes over that work unasked.
- **U64**: the folder's Put this back (`driveRestore`) does the same, and its status line wrongly says Save writes to the
  folder.

Each ledger row names a possible fix, not built and not yet put to Brad: keep the work aside by U19's rule when a folder copy
replaces it (U63 also offers clearing `LASTKNOWN` so the next file Save asks; U64 also says to name where 💾 Save writes).
Adding v2.02's `loadCounted` to these routes would not fix them: `driveRestore` already counts its load the same way, and
counting a load does not stop Save writing over the file.

## 5. Item 122: edit the whole record in one box

v2.08's one queued item, logged 24 Oct (*"Edit the whole record later as its own item"*). `ITEM-122-BRIEF.md` holds
the groundwork:
- §1–2: a field-by-field map of every surface that edits a record today (the RECORD panel, Requirement edit, the two
  pop-ups, the WBS panel, the CLIN drill, the Classify grid, the row, and the Add box);
- §3: twelve decisions for Brad, each with options and a recommended answer;
- §4: what carries over from the Add box (`reqNeeds`, the CCaR description rule, draw-once) and what does not
  (`reqCreate` must not be the edit writer; four setters act even on an unchanged value);
- §5: the defects above;
- §6: the collisions (triage rule, `npm run controls`, box controller, journal, PMO copy, the guide's prose, pinned checks
  and mutations);
- §7: a test plan.

The short form of the recommendation: one box that replaces 📋 Requirement edit and both written-field pop-ups, opened
from the RECORD panel's three buttons, holding the record fields but not the money. It keeps a held draft, draws its fields
once (so F2 cannot reach it), and writes only what changed in one save. It warns rather than blocks on required fields, and
an office change asks first and names its side effects. Every one of those is Brad's call.

## 6. Tracker: every open action

Owner: **C** = the Claude lead, **B** = Brad, **S** = the security team. "Ledger" = `recovery/v200/UNRESOLVED-LEDGER.md`
on `main`; **it has not been updated since 19 Oct**, so `NEXT-VERSION.md` and the commits are the record of what closed.

### A. Verification (first)

| # | Action | Owner | Next step |
|---|---|---|---|
| A1 | Read the 26 Oct 07:00 UTC nightly (the first on v2.07), the 09:00 fuzz, and the 08:00 Interface Review (the Routine's first run since v2.00 merged; `standards` itself was run by hand at each version, nothing new at v2.07). Then run `keys`, `dropdowns`, `dialogs` and `leftmenu` by hand on `f508fdb`: the nightly never reaches them (C1). | C | Anything other than the 8 D results is real: log it. If the nightly says it did not finish, run `validate:nightly` yourself (§9). |
| A2 | **The mutation sweep.** About 1,300 of today's 2,317 entries have never been swept as they are now written: 1,247 ids added since v1.99 (by prefix: `v200` 870, `v201` 2, `v202` 89, `v203` 16, `v204` 46, `v205` 15, `v206` 55, `v207` 154) plus 62 retargeted. The other 1,008 were last swept on the v1.99 board, against suites since deleted or cut (`audit-ppt`, recon 9, the ATR blocks), so whether they are still caught is just as unknown: a consumer moving away from a line turns its mutation equivalent without a word. **The go:** Brad, 20 Oct: "Go for sweeps but be mindful of usage credits" (spent on the pilot); that evening he scheduled the full sweep "after the weekly usage reset on Saturday 24 Oct, from a fresh session". It has not run, and v2.03–v2.07 shipped since. His order: the v2.00/v2.01 targets first (872 ids), then a full sweep before the hosted rebuild. | B (confirm the go), C | Ask whether that go stands for today's 2,317, and propose adding v2.02–v2.07 (375 ids) to the first batch. Use `tools/export-audit/sweep-shards.mjs`, **not** `validate:math` (its sweep is the old runner, whose 2.5 GB cap CRASHED big recon and import blocks). Recalibrate first (`--calibrate-only`; the hash covers the tools, which changed). Pass `--out` to a folder that survives restarts, and send or commit each batch's `results.jsonl` as it ends: the default `.math-reports/sweep-shards` is git-ignored. Run it with `PYTHONDONTWRITEBYTECODE=1` (it runs `mut-json.py` with `-I` and no `-B`, which dirties the tracked `.pyc`). **Time:** the only measurement is the 20 Oct pilot, 22 targets chosen for difficulty (6 the old runner crashed, 2 all-shard controls) at about 4 minutes each with 4 jobs, before the order-by-tag change: roughly 65–90 hours for 1,300 if that held. Measure the first 100 before quoting hours; CLAUDE.md's "most of a day" describes the old runner. **How:** `python3 -I -B tools/export-audit/mut-json.py > m.json`; write the chosen ids to a file, one per line; `node tools/export-audit/sweep-shards.mjs --calibrate-only --out DIR`; then `node tools/export-audit/sweep-shards.mjs --ids FILE --out DIR --jobs 4` (it resumes from `DIR/results.jsonl`). Start it detached (`setsid nohup … &`): background jobs here stop at two hours, so re-arm one watcher on each wake (`recovery/v202/HANDOFF.md` §7). Saved batches, a committed tree, nothing else running. A SURVIVED target gets a check, never a deleted mutation. |
| A3 | **A planned acceptance pass in the real environment** (none has been run). What exists: on 3 Oct Codex measured menu and label fit in Edge on Windows (review R11–R12, item 57); Brad's photos of the work machine found defects in items 2–3 (23 Sep), 43 (1 Oct), 102 (20 Oct), 114–116 and 118–120 (23 Oct); the CSP has opened and drawn on the work machine since v2.04. Never tried on purpose: exports opened in Excel (the v2.04 house style and the five-year chart were checked only by audit-other's XML parse; LibreOffice 24.2 was used only for U37 and D4-1); the Spend Plan Source in CCaR; the IDS batch import; the 1A9A with the comptroller; Edge on native Windows (ledger U28's pending part; the browser checks use a Segoe stand-in); the File System Access save, the IndexedDB handle and the Web Lock on real machines; which browser runs the CSP, from a `file://` share, and whether it refuses anything there; the shared folder on real OneDrive/Teams sync with two writers; and `npm run verify:file -- <the board he briefs from>` on v2.07, outside the repo (no run on a real board is recorded). | B, C | C writes a one-page checklist; one session with Brad at a work machine; the result logged as an item. Cheap first step: open the five-year workbook headless with `soffice` here. |
| A4 | **No independent review of v2.03, v2.04 or v2.05 is recorded.** v2.03 removed code found by a call graph (15 functions, `gridDedupe`, `fldHasPanel`, the row expander) and added the message log and the field registry; v2.04 removed three network transports, added the CSP, added `aiImport` through `inboundCheck`, and rebuilt the five-year workbook. | C | One review scoped to data loss, the import door, anything v2.03 removed that a handler or a saved board still reaches, and the five-year workbook's figures against `fydpData`. |
| A5 | v2.06 after its review fixes (`3a37796`) had no full run recorded before its merge; v2.07's final-tree run covers that code. `NEXT-VERSION.md` notes a locked cycle keeping `it.prior` links was not tested on its own. | C | Optional: one check that a lock keeps the links. |

### B. Decisions waiting on Brad

| # | Decision | Where | Recommend |
|---|---|---|---|
| B0 | Who owns v2.08, and its scope. `WORK-ASSIGNMENTS.md` still holds v2.00's ("Status: editing"); AGENTS.md: "Brad confirms the next owner", and until then work stays read-only. The outgoing owner (the v2.07 lead) stops at this branch's final commit. | AGENTS.md | Name the owner; record the assignment in `WORK-ASSIGNMENTS.md` (scope, branch, base `f508fdb`, gate owner) before any edit |
| B1 | Item 122's twelve decisions | `ITEM-122-BRIEF.md` §3 | As recommended there |
| B2 | Log and fix F1–F7 (§4). F2 is U35's class: fix and rate them together, and say whether typing lost to a Live tick is data loss. F4 moves money between destinations, so its fix also gets a `math-defects.json` entry (symptom as seen: "a prime's money shows under the government activity it used to go through"), with its check and mutation, beside `bulk-write-where-the-field-is-not-offered`. | §4 | F1, F2 (with U35) and F4 in v2.08; F3, F5, F6, F7 with them; F2 shapes item 122's design |
| B3 | U63 and U64 (P1 in the ledger, still open by code) | §4, ledger | The ledger's own fixes: keep the work aside by U19's rule (U63: or clear `LASTKNOWN`; U64: and name where Save writes) |
| B4 | Item 112's build choices, never answered. The Allocated question (it prints the lane draw: keep and rename the column Funded, or add the allocation as its own column?) and the own-office PMO tabs (not split by CLIN share) were stated in PR #20, which he merged, as "an open question for Brad". Only in `NEXT-VERSION.md` › 112 as built: a held year with nothing prints 0.000 where the log said –; a sheet wider than about two landscape pages prints across pages instead of shrinking to one page wide. | `NEXT-VERSION.md` 112 | One short list with a recommendation each |
| B5 | **The Help guide's five-year sections still describe the pre-v2.04 workbook** (board `t-fydp`, line ~2188, "adds a tab for each office after the three summary sheets"; the office part, line ~2075): words on screen that are untrue (v2.05 handoff M1). A board change, so it needs a go. | B4 | Rewrite both on go, with the wording B4 settles; then `npm run menus` |
| B6 | Item 113: the Priority Drill's narrow columns (unbanded, TOTAL) can show `###` in a narrow viewer. `NEXT-VERSION.md` says it did so before the house style. | `NEXT-VERSION.md` 113 | Ask whether to widen them |
| B7 | The sweep go (A2) | A2 | Confirm, v2.00+ first |
| B8 | Ledger rows needing a decision, as one list grouped by area: U5, U6, U16, U21, U22, U23, U25, U26 (two status lines false after an autosave lands; re-measure), U27 (re-measure first), U35 (with F2), U38, U39, U45, U54, U55, U65, U66, U67, U70, U8, U48, U7; U19's one-slot trade-off (a newer file copy left only in Teams version history after HOLD ON → OK), for Brad to accept knowingly, and its six wording points (U19H's header among them; `NEXT-VERSION.md` v2.00 › Not covered, U19); UI-m1, m2, m3 (its PMO-copy parts; the addReq part is gone), m4 and m7's lower-cased cycle label (board line ~34357), all re-checked first | Ledger, `NEXT-VERSION.md` v2.00 | Most are wording or one-line fixes |
| B9 | Item 71's remainder: the shared side-list write window (per-writer files and SharePoint eTags were his 6 Oct direction; SharePoint is gone since v2.04; v2.02's D4 narrowed it for execution data), and the launcher sidecar, already off unless a browser sets `spmtSidecar=1` (the team opens the board from a shortcut; Brad, 30 Sep: nobody uses the desktop app) | `NEXT-VERSION.md` 71 | Fold the window into the Azure build (107); retire the sidecar unless he names an office that uses it |
| B10 | Item 84: the RCN-EEIC ask column for a split prime (v2.02 D6b added a note; his 6 Oct "stays for review"), and its compatibility review of older versions reading v1.98+ files (Brad, 6 Oct). D6a covers v2.02+ readers only. | 84 | Ask whether the note and D6a close them |
| B11 | Item 82: its 6 Oct review asks for his rule before the funds-flow and ACE totals are called certified (v1.99's worked examples exist); and three of its bullets are choices nobody made: a kept PPBE cycle fixes the services it holds; journal entries from before a service-list change can no longer be put back; `bmSeedFromPp` rounds each figure (v2.02 D5c) but does not apportion a fraction arriving in a file | 82 | Ask whether the examples meet his rule; one line each on the three |
| B12 | Merge PR #25 (records only: `recovery/v208` and three `.gitignore` lines; the board is unchanged), so a session branching from `main` sees this tracker (the lesson in §8). Close PRs #15, #17, #19, #21, after carrying PR #19's `NEXT-VERSION.md` line recording v2.03's merge on his go (`065bc0d`) to `main` (PR #21's M1 and M3 are B5 and C5 here). And `claude/security-review-kit` (`b6f1ffc`). | §1 | Merge #25; close all four; ask about the kit |
| B13 | Is v2.07 where people open the board? A release tag? (None exists.) Since v2.02 (D6a) an older ORBIT refuses a file written by a newer one: a board saved in v2.07 cannot be opened by v2.02–v2.06, so everyone moves together. | — | Put v2.07 where people open it; tag it on his word |
| B14 | v2.07's five choices "decided in the build, not asked" (`NEXT-VERSION.md` v2.07): a required budget waived where nothing can be chosen; the record title from the CCaR list at Add; the money unchanged from the strip; From another year carrying what v2.06 carried; the From another year tab drawn for the box's office | `NEXT-VERSION.md` v2.07 | Confirm them, the waiver above all, before item 122 reuses `reqNeeds` |
| B15 | Item 117's follow-up: a trend report that follows the year-to-year links ("can be logged as its own item once the link is in place"; the link shipped). And BACKLOG entry 8: a diff of PPBE positions in the cycle comparison? | `NEXT-VERSION.md` v2.06, `BACKLOG.md` | Log them if he wants them |
| B16 | Delete the disabled v2.00 overnight check-in Routine (`trig_01PhhHK97YTPeEsCZr3X2fvw`)? | §3 | Yes |

### C. Docs and tools (no board change; each once Brad assigns it, one commit each, shown to him as a diff)

| # | What | Fix |
|---|---|---|
| C1 | `verify:grid` stops at `layout` (whose carried D ×8 always fails), so `keys`, `dropdowns`, `dialogs` and `leftmenu` never run in it or at night, and `standards` is not in the chain at all. Two checks failed unseen for a whole version this way (v2.02). | Run those five before `layout`, or have `layout` exempt D by name. Until then, run them by hand after any change to menus, exports or boxes. |
| C2 | No heap is set for recon and import; they die at 2 GB here. The 25 Oct nightly passed without it, so a pass depends on the container. `audit:suites` is an `&&` chain in `package.json`. | Put `--max-old-space-size=8192` in `package.json`'s `audit:import` and `audit:recon` scripts, so `audit:suites` and `validate:nightly` both get it. |
| C3 | `money-coverage.mjs` reads only single-quoted mutation ids (1,216 of 2,317 are double-quoted) and only quoted finds (38 template, 2 `String.raw` and 5 named-constant finds are skipped), and its split pattern also matches `{id:'` inside two find strings; `math-defects.mjs` reads single-quoted guards only. It can under-report; the one false pass possible is the struck-off-gap rule, which cannot fire while no gap is recorded. | Read entries the way `mut-json.py`/`mcread.py` do; prove it on a planted double-quoted id; re-run both. Never rewrite the ids. |
| C4 | One open money-map cell: `aiExport` × Fiscal year (the check holds only the year on screen, on a one-year fixture). | A second held year in audit-other's block "v2.04 (item 109) — the AI review: a request out, an answer in, nothing applied", or n/a with a reason. |
| C5 | Stale prose. **`CLAUDE.md`:** "~130 min, two sweeps of 250", "both builds", "parity", "six banners" and "12 banners" (the healthy count is 8 banners plus the legacy line, plus boot-same), the `audit-ppt` cost row, `exportPPT` in the audit description, the PowerPoint deck in the reconciliation summary, the trace matrix's "60 populated cells" and "both deck tables" (77 cells now), "2,021 targets", the Interface Review's name and cadence (§3), "Mutation ids are single-quoted" (true of every id added since v2.04 and still the rule, because `money-coverage.mjs` reads only that form until C3: keep it, and add that 1,216 older ids are double-quoted), the File map and Hand-edit points (v1.31 line numbers: use the §NN banners; v2.05 handoff M3), no current money-map line (add one, 301 / 108 / 192 / 1 and coverage 24/24, and leave the dated records), and no forward note that v2.02 E6 ran the reviews v2.00's gate skipped. **`AGENTS.md`:** "~26,700 lines", "7 banners", "verify:grid exit 0", "2,021". **`README.md`:** line count, the 📁 File menu, PowerPoint, Confluence and SharePoint. **`WORK-ASSIGNMENTS.md`:** the v2.00 assignment (B0). **The nightly Routine's prompt:** "2,021 targets" and the watcher's timeout (§3), only with Brad's OK. | One docs pass. |
| C6 | `CLAUDE.md`'s *Before every commit* should say: unshallow; the 8 GB heap for recon and import; and `python3 -I -B` for `mkmut.py` and `mut-json.py`, both of which import `mcread` (plain `-I` rewrites the tracked `recovery/v200/bin/__pycache__/mcread.cpython-313.pyc` on the first run in a fresh checkout). `CLAUDE.md` (the sweep section) and `AGENTS.md` (line ~50) still say plain `-I`, and `mut-json.py`'s header does too. | Three lines, and the two `-I`s. |
| C7 | `NEXT-VERSION.md` › Open items 63, 71, 82 and 84: the v1.99 bullets name the item that addressed them (92–97, 88) but were never struck; nothing notes v2.02's D3 (63's office-month cells), D4 (71's execution share), D5a and D5c (82's ACE breakout and `bmSeedFromPp`), D6a and D6b (84), or the ATR/BTR removal, which makes the reprogramming-log bullets in 71 and 82 moot. Later › 106 still lists the CSP and Clear this computer, shipped in v2.04. "485 planted mistakes" (2,317). The 29 Sep card-era note (removed in v2.03). The bare `GATE_V200` line in the v2.00 section (~1747). | Strike each done bullet with the item that closed it. |
| C8 | The ledger: record what closed since 19 Oct. Closed but unrecorded: U9, U9L, U15, U24, U29, U31, U43, U47, U51, U52, U53, U60, U62, U72. Fixed and still marked "closed when the lead integrates": U41, U42, U56–U59. U17 probably closed (by inference). UI-MENU overtaken by v2.05. U28: not reproduced at `981a334` or today (layout J passes): ask Brad to close it; its Windows part is A3. Still open: §6 B3 and B8 above, U14's last question (what "genuine stored plans" takes in; v2.02's D7a and D7b settled the other two), U18's and U61's residuals, U69 and U40's named limit (re-measure: item 89 may have narrowed both for locks from v2.02), U11 (its `driveRpPush` part is gone), U12. | One ledger commit. |
| C9 | `BACKLOG.md` entries 1 and 3 name `addReq` and `rowChipsHtml` (both gone); entry 9 was superseded by item 112. | Mark them. |
| C10 | Test gaps: `standards` opens 5 of the 48 boxes (item 71); `dropdowns-visible` scrolls every item into view, so a menu that cannot scroll passes, and its docked pass runs only at 1536 and 1920; `hostile.mjs` opens the pop-up with retired kinds, so the 📄 pop-up is never swept; `ia-shots.mjs` does not photograph the left menu; nothing counts mutation targets at night (`mcount.py` by hand only). | Tools changes, each proved on a planted fault. |
| C11 | `recovery/v200/bin`'s shell runners name `audit-ppt` and some push to the v2.00 backup branch. | Use only `mkmut.py`, `mcount.py`, `mcread.py` from there. |
| C12 | Rules 1–2, 6–7 and 9–11 of §7 are written only in handoffs. | Move them into `AGENTS.md`. |

### D. Carried limit

**layout-fits D ×8**: as the board opens, the first requirement starts 323–420 px down; the check wants it above 320 px.
6 to 15 rows are still on screen. It fails at 1920, 1440, 1366 and 1024, docked and sliding over. Brad carried it from
v2.00. Any other browser failure is real.

### E. OCIO and security (Brad, the security team)

| # | Date | What | Owner |
|---|---|---|---|
| E0 | 23 Oct | POA&M milestone: interim pilot restrictions in effect. Carried by the v2.02–v2.04 handoffs as "Brad confirms"; no confirmation is on record (`NEXT-VERSION.md` says only that they "stand for now"). | B |
| E1 | 6 Nov | Evidence package to OCIO (stays at `f616daa`); repository hardened. `main` shows `protected: false`. C writes the one-page list (branch protection, required review, signed commits, secret scanning and push protection, Dependabot alerts), with the `orbit-review-mcp` Worker and its token (§1), and sends it to Brad (SendUserFile, not git) well before 6 Nov: it has been carried unwritten since 20 Oct. Brad applies it. | B, C |
| E2 | 20 Nov | CUI categorization confirmed (also answers the Azure plan's D-09). | B |
| E3 | 18 Dec | Hosting platform selected; items 107 (Azure build, draft plan outside git) and 100 (IL5, Zero Trust) follow. | B |
| E4 | — | Questions for the security team, none answered on record: GenAI.mil for this data (item 109: "Brad to confirm with the security team", recorded only in `NEXT-VERSION.md`'s v2.04 notes and the unmerged v2.05 handoff, not on the Open list); CUI marking wording and places (Brad, 22 Oct: "Let's leave the classification marks off"; item 106 keeps CUI markings for later); the 15 deployment questions and the plan's 8; which IL5 controls are inherited; the Zero Trust target; the hosting date. Whether the Azure plan's document 6 (22 decisions; D-01, D-03, D-04, D-07, D-09, D-10 first) was sent is unknown. | B, S |
| E5 | — | Item 106's remainder (Later; Brad: not required for the desktop file): SHA-256 fingerprints, a hash-chained journal, CUI markings, a static-analysis scan with `npm audit`. The written list of what ORBIT leaves on a machine is not on v2.04's "still not built" list: ask whether Clear this computer's confirm counts as it. | B (go again) |

### F. In flight

As of the commit that adds this text (26 Oct, about 1:15 UTC): one background job, `prove.py` re-running v2.07's 154
mutants against their own checks (2 jobs). Its verdicts will be committed beside the proofs list as
`recovery/v208/v207-proved.jsonl`, and this paragraph updated. **If that file is not on the branch, the run did not
finish**: run it again (§9, Commands; it resumes from what it wrote). No sweep, agent or Routine change is running; PR #25
is a draft. The scratchpad (the gathered evidence behind this file, the claim-by-claim results, the repro scratch, v2.07's
mock-ups) leaves with this session.

## 7. Brad's standing rules (from `recovery/v202/HANDOFF.md` §5, updated; rules 1–2, 6–7 and 9–11 are written only in handoffs, C12; `CLAUDE.md` and `AGENTS.md` win where they speak)

1. No merge, deploy or publish without Brad's go. Draft PRs are fine. Never force-push, and never rewrite history on a
   shared branch.
2. The can't-fails are data loss and money. Every word on screen must stay true.
3. The sweep runs only on his **named** go. During development `mutate.mjs` is **text only**: `mkmut.py`, `mcount.py`,
   `prove.py`, with `python3 -I -B` (`CLAUDE.md` and `AGENTS.md` still say `-I`; until fixed, `-I -B` wins here). Never
   import it; never `npm run mutate` or `validate:math`. `validate:nightly` any time.
4. Changes ship as one version on "go": logged in `NEXT-VERSION.md` first, `BUILD` bumped once, pushed once.
5. Never `playwright install`. Never commit a populated board.
6. One heavy suite at a time on this machine; `audit-import` alone (about 13–16 minutes: 12 min 52 s on 19 Oct, about 16
   per the v2.02 handoff). `prove.py` is the one exception: run nothing beside it.
7. Expected values are hand-written literals. A new check fails on the base and passes on the fix; a CONTROL passes on the
   base and fails on its own mutant. Prove both before claiming either.
8. Show only what changed: changed lines or a unified diff, never a whole file (21 Oct).
9. OCIO and Azure deliverables are CUI and never go into git; the OCIO response does not mention AI tools.
10. Ask with AskUserQuestion only while background work runs: it holds the turn until he answers.
11. Commits end with the attribution lines the session's own system gives; GitHub comments end with the Claude Code
    footer; no model name in anything pushed beyond those lines.
12. (`AGENTS.md`) One editing agent at a time; Brad names the owner and the scope; a review finding is not permission to
    fix it; `npm run check` before every commit; never edit a suite while a sweep runs; scheduled runs never commit or push.

## 8. Lessons from v2.06 and v2.07

| What happened | Rule for next time |
|---|---|
| v2.07's four test agents found and fixed nine defects; then two independent reviews (reviewers by area, each finding re-run by a skeptic trying to refute it) confirmed 16 and then 12; writing the fixes' own checks found 3 more. Every suite and browser check passed on the final tree. v2.06's reviews found 17, plus one older defect (18 fixed). | Budget for it: build, review with skeptics, a check and a mutation per fix, then a second review of the fixes, before asking for the merge. |
| Chromium fires `change` on every arrow key of a closed `<select>`, so the Add box's office question locked the first office on the first ArrowDown. jsdom does not do it unless the test dispatches it. | Never commit a choice on a keyboard-reachable select's `change`: Enter chooses. Prove it with `npm run keys`. (F3 is the same trap, older.) |
| Playwright dismisses a `confirm()` by default, so layout M and standards failed once the Add box asked before replacing typing. | A browser tool that drives a path with a question answers it explicitly. |
| `budParseName` built a RegExp from a raw office name (`C++` stopped the board drawing); a BAE entry with no date and an estimate with no totals each stopped every redraw. | Escape every name before `new RegExp`; a draw function tolerates any stored shape; run the hostile sweep after touching a panel. |
| `budReg()`'s cache was not keyed on the offices, so an office added in Setup had no budgets until a reload. | A memo is keyed on everything it reads. |
| `reqNewId` minted `NEW-Brad's-1`, which the import door refuses, and the whole submittal went with it. | Anything the board mints passes its own door; test with an apostrophe in an office name. |
| The fixes of the first review introduced two defects of their own (the status line read the year off the wrong requirement; an office starting with punctuation stopped matching), found by the agents writing their checks. | A fix is not done until its own check has gone red on the base and green on the fix. |
| A check that bumps `newSeq` shifts the ids later checks in the same board expect (the rule is applied at `audit-import.mjs` ~12440; the event is not recorded elsewhere). | A check that changes shared state goes last in its board, or gets its own. |
| `python3 -I` does not stop bytecode: the first `mkmut.py` run in a fresh checkout rewrites the tracked `mcread` `.pyc`, so git shows it modified. | `python3 -I -B` (C6). |
| `.gitignore` takes every `*.json`, so `v207-proofs.json` was silently left out of the commit that said it kept it (caught by this handoff's skeptic). | `git show --stat` after every commit; `git check-ignore -v` before committing a new `.json`. |
| `prove.py` ran each cut-down suite only on the mutant. A kept block that reads a top-level `let` an earlier block writes fails on every board, and would have read every mutant as CAUGHT (found by this handoff's completeness check; v2.07's own checks all turned out clean). | A check that judges a mutant must first pass on the unmutated board. Fixed: `prove.py` runs that step and refuses a check that fails it. |
| `slim.py`'s "kept N" counted helper blocks, so a misspelt scenario name kept nothing, ran nothing, and would have read SURVIVED (caught by the skeptic). | Fixed: a name that matches no scenario is refused. A tool that judges must be able to fail; prove it does. |
| `pkill -f` matched the shell running it (exit 144): the Bash tool's shell carries the command text in its argv. | End only processes whose PIDs you recorded. |
| The defects in §4 were found by reading code for item 122 and by checking this handoff; each looked plausible, and one (the Live tick) could have been wrong. | Before reporting a code-reading finding as a defect, reproduce it in a few lines of jsdom and keep the script. |
| A Routine's `finished_at` read as a 40-second run; the nightly's report came half an hour later in a second turn, and its watcher hit the 30-minute background limit. | Read the run's session result, not the trigger. |
| The last three handoffs were never merged, so a session branching from `main` never saw their trackers, and their open items went unworked for three versions. This one's first draft also dropped several of their items until a claim-by-claim check found them. | Merge the handoff (records only) or point to it from `main`; check a handoff against its predecessors item by item. |

The older lessons, and how to run long work here (a restart-proof runner, re-arming the watcher, the usage budget), are in `recovery/v202/HANDOFF.md` §6 and §7 and in `CLAUDE.md`'s version sections: run `mcount.py` after
every board change and merge; grep the suites for any wording you change; declare a `let` that `syncBtns` or `render`
reads beside `let MS`; read exports' bytes with a real XML parser; check a PR's `merged` before pushing to it. Two are not
yet met: standing rules still live only in handoffs (C12), and the placeholder grep must include `NEXT-VERSION.md` (the
bare `GATE_V200` line, C7).

## 9. How to pick up (a new Claude session)

1. Access (§2). `git fetch --unshallow origin` if shallow.
2. Read `CLAUDE.md`, `AGENTS.md`, `WORK-ASSIGNMENTS.md` (stale: still the v2.00 assignment), this file and
   `ITEM-122-BRIEF.md`. **Make no edit until Brad names the v2.08 owner and scope** (B0).
3. `git log -1 origin/main`: `f508fdb` or later. If PR #25 is merged, the `recovery/v208` tools are on `main`; if not,
   `git fetch origin ccr-ce1f5388-a75g07 && git checkout origin/ccr-ce1f5388-a75g07 -- recovery/v208 .gitignore`
   (this stages both; commit them as records, apart from code).
4. `npm ci`, `npm run check`, then
   `python3 -I -B recovery/v200/bin/mcount.py tools/export-audit/mutate.mjs prioritization-board-grid.html` (expect 2,317,
   each once) and `node recovery/v208/repro/found-on-main.mjs` (expect eight PRESENT until fixed).
5. `list_triggers` against §3; read the nightly, fuzz and Interface Review reports, and run the four browser checks (A1).
6. Ask Brad, in one batch: the owner and scope (B0); item 122's decisions (B1); F1–F7 and U63/U64 (B2, B3); the sweep go
   (A2, B7); a date for the real-environment session (A3); the §6 C list, including C5's Routine prompt; and the rest of
   §6 B as one grouped list.
7. Write E1's one-page repository-hardening list and send it to Brad (SendUserFile, not git) well before 6 Nov.
8. Once Brad assigns it: §6 C, one commit each, each shown to him as a diff. Until then, read-only work only.

**Commands**
- One suite: `node tools/export-audit/<suite>.mjs`; recon and import with
  `NODE_OPTIONS="$NODE_OPTIONS --max-old-space-size=8192"`, alone.
- Browser checks: `npm run verify:grid`, then `keys`, `dropdowns`, `dialogs`, `leftmenu` and `standards` one at a time.
- The gate without the sweep: `NODE_OPTIONS="$NODE_OPTIONS --max-old-space-size=8192" npm run validate:nightly` (about
  25–55 minutes recorded), then the five browser checks above by hand.
- One mutant: `python3 -I -B recovery/v200/bin/mkmut.py tools/export-audit/mutate.mjs prioritization-board-grid.html <id> <out.html>`.
- Each mutation against its own check, from the repository root:
  `JOBS=2 HEAP=6144 python3 -I -B recovery/v208/bin/prove.py IDS.json OUT.jsonl [ids]`, with `IDS.json` a list of
  `{id, caughtBy: "<suite> / <scenario name substring>"}` (v2.07's are in `recovery/v208/v207-proofs.json`). The defaults
  (4 jobs × 6 GB) exceed this machine; run nothing beside it, and keep `OUT.jsonl` (commit or send it). It runs each check
  on the unmutated board first and judges nothing with one that fails there (`NOT CLEAN`: a kept block reads a top-level
  `let` an earlier block writes, such as audit-import's `V14`, `V185W`, `V186L`, `W2FX`, `W2THEIRS`, `W3FILES`; add the
  writer block's name to `caughtBy`). `CALIBRATE_ONLY=1` runs only that step. `v207-proofs.json` holds the 154 new ids;
  the 8 ids v2.07 retargeted (`proposal-gate-open`, `add-total-*` 3, `add-whole-refusal-gone`, `v197w1-guard-addReq`,
  `v199-newreq-ccar-cut`, `v206-117-no-link`) need `caughtBy` entries before they can be re-proved.
- A suite cut to some scenarios:
  `python3 -I -B recovery/v208/bin/slim.py tools/export-audit/<suite>.mjs tools/export-audit/_slim-prove-x.mjs "<name>"`,
  then `node tools/export-audit/_slim-prove-x.mjs`, then delete it. A name that matches no scenario is refused.
- Money map, read-only: `node tools/money-map.mjs --check` (`npm run money-map` rewrites `money-map.md`).

## 10. A suggested order for v2.08 (a proposal; nothing in it is approved)

1. A1: read the first nightly, fuzz and review on v2.07, and run the four browser checks.
2. One batch of questions to Brad (§9, step 6). Write E1's one-page hardening list and send it to him (not git): 6 Nov is
   close.
3. Once he assigns them: §6 C as small reviewed commits (docs and tools only).
4. On his go: item 122 with F1–F7 (F2 shapes the box), U35 with F2, and U63/U64 if he chooses. Then two rounds of review
   with skeptics, each mutation proved with `prove.py`, a `validate:nightly` (8 GB heap) on the final tree, the five
   browser checks by hand, and `mcount` on the final board.
5. The sweep, on his confirmed go, in saved batches (A2).
6. The real-environment session (A3), and an independent review of v2.03–v2.05 (A4).
