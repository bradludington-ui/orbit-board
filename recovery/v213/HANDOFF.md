# ORBIT: handoff after v2.12, for v2.13

**Written** 2 Nov 2026, 01:15–04:00 UTC (the evening of 1 Nov in Eastern), by the v2.08–v2.12 lead (Claude, session
`session_013JHjSqanzfLoGiH8kiFs1t`; its v2.08 assignment commit `29170cc` carries that session), at `main` `fe0c83d`, for
whoever picks up next: a new Claude session, Codex, or Brad. The facts were gathered 01:15–02:30 UTC; the Routine facts in §0
and §5 were re-read with `list_triggers` at 03:42 UTC. It goes in as `recovery/v213/HANDOFF.md`. **It changes nothing in the
board.**

**Its authority.** Brad's request of 1 Nov, evening (Eastern): *"Provide handoff better than your previous handoff"*. The
v2.12 assignment does not cover it: its allowed files name `recovery/v212/**` and `recovery/item133-mockup/**`, not
`recovery/v213/**`, and its status says "A push after the handoff commit is new review work" (`WORK-ASSIGNMENTS.md:37-45`).

**Three facts from the lead's own transcript** (the repository cannot show them; the lead read them out of its session for
this file):
1. **Brad's merge words.** For PR #30 he asked "Did we merge" at 00:10 UTC on 2 Nov and then wrote "Merge" at 00:14 UTC
   (7:14 PM EST, 1 Nov); the lead merged #30 with a merge commit through the GitHub tools. The commit that carries this file
   records that in `WORK-ASSIGNMENTS.md:44-45` and `:82`. #27, #28 and #29 were each merged on his "Merge when ready" (27 Oct
   01:48, 17:27 and 21:26 UTC). The session's token is Brad's own account, so `merged_by` reads `bradludington-ui` either way (P9).
2. **This session never wrote or sent the E1 hardening list.** Its transcript (26 Oct to 2 Nov) holds no file and no message
   about one. Sessions before 26 Oct are not visible here (§15).
3. **Outside git, by rule 9.** On 28 Oct Brad shared IT's records-management questions and its Azure baseline for the hosted
   build; the lead answered the first, reviewed the second and drafted Brad's reply asking for changes before development
   starts. None of it is in git, and nothing of it is restated here. Brad holds the baseline and the reply; they bear on E3 and
   items 100 and 107.

**How it was made.** Six read-only agents gathered the facts, one per area (state, carry-forward, queue, tests, lessons,
security), and a skeptic re-checked each one's claims against the repository, the Routines and GitHub. Where a skeptic
corrected a claim, the corrected value is used. On `fe0c83d` only `npm run check`, `mcount`, `money-map --check`,
`money-coverage` and `math-defects` were run, and all five pass, plus a static jsdom parse (no scripts) that measures the
guide at 69,950 characters (§2). No suite, browser check, prover, fuzz or sweep was run. Five checkers then re-checked the
draft claim by claim and a fixer applied their corrections; a critic named what was still missing and a second fixer added
it, each addition checked against the tree first. Last, the lead read the whole file, re-ran those five commands on
`fe0c83d` itself (every figure as in §2) and wrote the three facts above.
Every claim carries its evidence (a SHA, `file:line` at `fe0c83d`, a command, a Routine session); what could not be checked
is in §15. Times are Eastern (EST, UTC−5 since 1 Nov) unless marked UTC. The last handoff was `recovery/v208/HANDOFF.md`
(25–26 Oct); **none was written for v2.09–v2.11**, so §6 carries every open item of v2.08's forward.

**Line numbers are at `fe0c83d`.** The first edit to `NEXT-VERSION.md` (logging item 136, or C7's clean-up) moves every
Shipped line cited here, and any board edit moves every `board:N`. After an edit, read a citation with
`git show fe0c83d:<file> | sed -n 'Np'`, or find it by the symbol or heading named beside it.

---

## 0. Dates that are near

| When (Eastern) | UTC | What | What to do |
|---|---|---|---|
| Sun 1 Nov 10:51 PM | 2 Nov 03:51 | **Done.** The handoff workflow (`wf_7e441fd0-90c`) finished at 03:51 UTC. The lead deleted the last pending check-in Routine (`trig_01H9WbaFPzEajvb22o64Vvo6`, due 04:01) unfired, reviewed this file, committed it with the close of v2.12's entry in `WORK-ASSIGNMENTS.md`, pushed `ccr-0b15d8d5-ypf61n` and opened a **new** draft PR. The two earlier check-ins (`trig_014ZUATQRVpUiAy5Y8jqRHiY`, 02:29; `trig_01PiAC9ySc2d4uYNMXEnrRzD`, 03:20) fired, found the workflow running and re-armed. No handoff check-in remains. | That branch is PR #30's, **already merged**: the push is a fast-forward from `e6da1de` (`git merge-base --is-ancestor e6da1de fe0c83d` succeeds) and does not reopen #30. Find the handoff PR with `list_pull_requests` (state open, head `ccr-0b15d8d5-ypf61n`) and open none of your own. **Merge the handoff PR before any v2.13 commit goes to `ccr-0b15d8d5-ypf61n`**: v2.09–v2.12 were all pushed to that branch (`WORK-ASSIGNMENTS.md:41`), and any later push there joins the open handoff PR. Either merge it first, or build v2.13 on a branch of its own and name that branch in `WORK-ASSIGNMENTS.md`. |
| Mon 2 Nov 2:01 AM | 07:01 | Nightly math validation: the **first run on v2.12** | Read it from its session (§5). It should fail only layout D ×8, with defects 13 / 43, coverage **27/27**, money map **322 / 119 / 202 / 1**, trace 77. The 1 Nov run on v2.11 printed 25/25 and 308/112/195/1. Any other figure is a change. |
| Mon 2 Nov 3:08 AM | 08:08 | Weekly Interface Review: its first run since v2.07 | `standards` should give 0 findings. `ia:shots` will probably time out on the same 3 views as on 26 Oct, which is a fault in the tool (§7 C10). Week 45 is the "export and reporting flows" scan. |
| Mon 2 Nov 4:05 AM | 09:05 | Data-loss fuzz, 12 rounds, the first on v2.12 | It should lose nothing. Note the seed. |
| **Fri 6 Nov** | — | **OCIO E1**: the evidence package goes to OCIO, and the repository is hardened. | `main` is unprotected, and **no record shows the one-page hardening list was ever written** (§8, items 33–35). |
| Fri 20 Nov | — | E2: CUI categorization confirmed (it also answers the Azure plan's D-09). | Brad. |
| Fri 18 Dec | — | E3: hosting platform selected. Items 107 and 100 follow from it. | Brad. |
| Late Dec | — | Joint PRR with the Services. Item 133's workbook (v2.13) is for it. | §9. |

## 1. Read this first

1. **v2.12 is on `main`**: `fe0c83d`, a two-parent merge of PR #30 (parents `bbb7ee9` and `e6da1de`), 1 Nov 7:14 PM. `BUILD`
   is `'v2.12 (1 Nov 2026)'` (board:3376). The board file is byte-identical to `d630240`, the tree v2.12's gate ran on
   (`git diff --quiet d630240 fe0c83d -- prioritization-board-grid.html` exits 0). Branch v2.13 from `origin/main`.
2. **Do not work in the main checkout.** `/home/user/orbit-board` sits at `41a581d` on local `ccr-0b15d8d5-ypf61n`, 17
   commits behind `origin/main`, and its `CLAUDE.md` has no v2.12 section (item 9). Use a fresh worktree (§2). Leave its
   `node_modules` alone: every worktree links to it (§3).
3. **Read `CLAUDE.md`, `AGENTS.md` and `WORK-ASSIGNMENTS.md`.** Their rules win, but many of their numbers are stale (§7 C5).
   `WORK-ASSIGNMENTS.md`'s v2.12 entry is closed by the commit that carries this file (lines 44-45 and 82: merged on Brad's
   "Merge"); it names no v2.13 owner.
   **Make no edit until Brad names the owner and the scope.**
4. **No checking Routine (nightly, fuzz, Interface Review) has run on v2.12 yet.** The nightly and the fuzz last ran on v2.11
   (`bbb7ee9`), and the Interface Review on v2.07 (`f508fdb`). The only Routines to fire since the merge are the one-shot
   handoff check-ins (02:29 and 03:20 UTC), and they check nothing.
5. **Check whether a PR is merged with `pull_request_read get` (`merged:true`) or with `merged_at`.** `list_pull_requests`
   shows `merged:false` for **every** PR it returns: all 29, #1 to #30 (there is no #12), merged or not. Only `merged_at`
   tells them apart: #15, #17, #19 and #21 were closed unmerged and have none. `pull_request_read get` gives `merged:true`
   (checked on #30).
6. **Merge with a merge commit, never a squash.** The suites read pinned commits out of history: `c81e995`, `bbb7ee9`,
   `b2cb041`, `7ee498a`, `ebe702e`, `68b02e9`, `84dcaf9`, `77882d9` and `1589749`. All of them are ancestors of
   `origin/main` today.
7. **Heaps and Python.** Node's default here is about 2 GB; `audit-board`, `audit-recon` and `audit-import` need 8 GB by hand.
   *Append* it, because `NODE_OPTIONS` already holds `--use-openssl-ca`: `NODE_OPTIONS="$NODE_OPTIONS --max-old-space-size=8192"`
   (`CLAUDE.md:4236` replaces it; do not copy that). Run Python as `python3 -I -B`: `-I` sets `ignore_environment`
   (checked, = 1), so `PYTHONDONTWRITEBYTECODE=1` does nothing under it. The v2.08 handoff's advice for `sweep-shards.mjs`
   therefore does not work: it spawns `python3 -I` without `-B` (`sweep-shards.mjs:79`).
8. **Anything kept only in a session's scratchpad is lost when the session ends.** Send deliverables to Brad as they exist.
9. **Check which `CLAUDE.md` you were given.** A session whose working directory is `/home/user/orbit-board` loads that
   checkout's `CLAUDE.md` (at `41a581d`). It ends at the v2.11 section, so v2.12's rules are not in your instructions: one
   stored value has one reader; a rule written in two places is two rules; two proof runs never share a tree; a browser check
   never sets storage from an init script; the guide is measured as the browser draws it. If your loaded instructions have no
   `### v2.12` heading, read `git show origin/main:CLAUDE.md` (its v2.12 section starts at `:4770`) before acting.

## 2. The first 15 minutes: is the tree what this file describes?

**If `/home/user/orbit-board/.claude/worktrees` does not exist, you are in a new container**, and the paths below do not
apply. Clone, run `git fetch --unshallow` if the clone is shallow, then `npm ci`. Do not `ln -s` `node_modules` there: only
this container's `.git/info/exclude:11` ignores a symlink (the `.gitignore:42` rule `node_modules/` matches a directory only).
The v2.12 gate report JSONs (`v212-int/.math-reports/`, ignored by `.gitignore:46`) exist only in this container; in a new one,
cite `NEXT-VERSION.md:704-706` for v2.12's gate instead.

```
git -C /home/user/orbit-board fetch origin
git -C /home/user/orbit-board worktree add --detach /home/user/orbit-board/.claude/worktrees/v213 origin/main
cd /home/user/orbit-board/.claude/worktrees/v213
ln -s /home/user/orbit-board/node_modules node_modules     # how every worktree here gets it; in a fresh clone: npm ci
git rev-parse --is-shallow-repository                       # false   (true: git fetch --unshallow origin)
git log -1 --format='%h %p %s' origin/main                  # fe0c83d bbb7ee9 e6da1de Merge pull request #30 … (or later)
grep -n "^const BUILD=" prioritization-board-grid.html      # 3376:const BUILD='v2.12 (1 Nov 2026)';
wc -l -c prioritization-board-grid.html                     # 39986 2913530
npm run check                                               # exit 0, about 5 s, ends "all checks passed"
python3 -I -B recovery/v200/bin/mcount.py tools/export-audit/mutate.mjs prioritization-board-grid.html
    # {"entries": 3149, "once": 3149, "missing": [], "multiple": [], "unparsed": []}
node tools/money-map.mjs --check   # money map holds — 322 cells: 119 proven, 202 n/a, 1 open; the report is current
node tools/money-coverage.mjs      # money coverage holds — 27/27 surfaces have mutations aimed at them, 0 recorded gap(s) …
node tools/math-defects.mjs        # REGISTER HOLDS — 13 known defect(s), 13 guarded by 43 mutation(s)
git status --short                 # empty. If the tracked recovery/v200/bin/__pycache__/*.pyc shows modified, restore it
                                   #   with git checkout -- recovery/v200/bin/__pycache__
```

`npm run check` also reports 372 inline handler names resolved, 51 boxes ok, 7 award sorts on `awdCmp`, CSP `connect-src`
`'self' file: data: blob:` and `pubState` null. The guide's size, read statically (a parse with no scripts, not a suite):
`timeout 120 node -e 'const {JSDOM}=require("jsdom");const d=new JSDOM(require("fs").readFileSync("prioritization-board-grid.html","utf8"));console.log(d.window.document.getElementById("helpDoc").innerHTML.length)'`
prints **69950**. That is 50 characters short of audit-import's limit (`< 70000`, `audit-import.mjs:3424`).

Then call `list_triggers` and read each Routine's last result from its session (§5). If any figure above differs, stop: this
file no longer describes the tree.

## 3. Where things stand (2 Nov: gathered 01:15–02:30 UTC; Routines re-read 03:42 UTC)

| Thing | State | Evidence |
|---|---|---|
| `main` | v2.12, `fe0c83d`. Board 39,986 lines and 2,913,530 bytes (`check.mjs` reports "39987 lines, 2.77 MB"). | `git log`, `wc` |
| Releases since the v2.08 handoff | #25 the handoff (`d920ea0`) and #26 item 123's log (`ddf6b4b`), both 26 Oct. **#27 v2.08 and v2.09 together** (`89466fa`, 27 Oct 9:37 AM). #28 v2.10 (`b2cb041`, 1:28 PM). #29 v2.11 (`bbb7ee9`, 5:27 PM). #30 v2.12 (`fe0c83d`, 1 Nov 7:14 PM). v2.08 never had a PR of its own. The last squash was #26; every merge from #27 on is a two-parent merge commit. | `git log --first-parent`, GitHub `merged_at` |
| Open PRs | Only this handoff's own draft PR. #30 has no comments and no reviews; Brad's "Merge" for it is in the lead's transcript (header, fact 1). | `list_pull_requests`, `get_comments`, `get_reviews` |
| v2.12's gate (recorded, not re-run) | `validate:nightly` on `d630240`, 1 Nov 13:11–14:02 UTC, 51 min. Every stage held except layout D ×8; trace 77 cells; fuzz seed 374193428. Run by hand on `d630240` and passing: `keys`, `dropdowns`, `dialogs`, `leftmenu`, `pmoyears`, `pointer`, and `standards` (0 findings). `pmosave` was fixed in the check (`3e29863`) and passes 12/12. No sweep. | `NEXT-VERSION.md:704-706`; report JSON `.claude/worktrees/v212-int/.math-reports/math-2026-11-01-13-11-03.json` |
| Mutation targets | 3,149, each matching once: 1,939 with single-quoted ids, 1,210 double-quoted. 12 are declared equivalent: 11 older ones, plus `v209-rv2-clin-row-unbounded`, which was born equivalent at `26a1f1e`. | `mcount`; grep |
| Proof records | v2.12: `recovery/v212/proved-INT.jsonl`, 364 of 364 caught on the final board (350 new, 14 retargeted). Every one of the 999 v2.07–v2.12 entries has a record. Twelve older ids retargeted in v2.07 and v2.08 have no record on their current text (§7 A6). **1,074 of the 1,089 v2.00–v2.06 entries have none** in any of the 34 proof files `recovery/**/*proved*.jsonl`. The v2.07, v2.08 and v2.11 records are named `recovery/v208/v207-proved.jsonl`, `recovery/v208/v208-proved.jsonl` and `recovery/v211-proved.jsonl`, not `proved-*`, so a literal `proved-*.jsonl` glob (31 files) misses them. The v2.00–v2.06 proofs exist only as prose, plus v2.00's manifest (`recovery/v200/manifests/mutation-manifest-e2d0bc6.tsv`, which has no verdict column) and a 20-row per-mutant verdict table for v200-u41 and its kin (`recovery/v200/evidence/cc/867fd4a/out/mutant-verdicts.tsv`). | node counts over `find recovery -name '*proved*.jsonl'` |
| Sweep | The last full sweep was v1.99 on 7 Oct: 1,128/1,128 caught plus 11 equivalent, of 1,139. Since then, only the 20 Oct 20-target pilot. | `NEXT-VERSION.md:6555-6563`, `:3212-3219` |
| Registries | Money map: 46 surfaces, 322 cells, 119 proven, 202 n/a, **1 open** (`aiExport` × Fiscal year, open since v2.04). Coverage 27/27. Defect register 13 defects, 43 guards; it has not changed since `84dcaf9`, 23 Sep. | the three commands |
| Guide | 69,950 of 70,000 characters. The next addition must trim it or raise the budget on purpose. | §2 |
| Worktrees | 18 under `.claude/worktrees`: `v210-base`, `v212-int`, `v213-handoff` and 15 `wf_*`. Every HEAD is an ancestor of `origin/main`. None is locked. Two hold stray bytecode: `v210-base` (untracked `item130-mockup/__pycache__/`) and `wf_021ba697-b57-1` (the tracked `mcread` `.pyc`, modified). **No worktree has its own `node_modules`.** `v213-handoff`'s links through `v212-int`'s to `/home/user/orbit-board/node_modules`, and the others link straight there. Removing `v212-int` breaks `v213-handoff`. | `git worktree list`, `readlink` |
| Branches | 24 on the remote: `main`, 12 merged, and 11 not merged (§6, row "branches"). 55 local branches, all contained in `origin/main`. The local `main` is stale at `db41c0a` (v2.05). There are no tags, local or remote. | `git branch -r --merged`, `git cherry`, `ls-remote --tags` |
| Queue (`NEXT-VERSION.md`) | Open: 63, 71, 82, 84, 100, 107, 124, 129, 131, **133 (v2.13)**, 135. Later: 106, plus the "considered, not recommended" notes. Withdrawn: 1. | `:9-405` |
| Machine | 4 cores, 15 GB RAM, Node v22.22.0, Python 3.13.17, Chromium revision 1243 at `/opt/pw-browsers`, playwright-core 1.63.0, jsdom 27.4.0. Disk: 23 GB free. Running now: no ORBIT job. | `nproc`, `free`, `ps` |

## 4. Access and permissions

| # | Access | State | Check |
|---|---|---|---|
| P1 | Push to `bradludington-ui/orbit-board` | Works: the commit carrying this file was pushed to `ccr-0b15d8d5-ypf61n` from the lead session on 2 Nov. Attach by the current name with `add_repo` (access `push`); the old `spmt-…` name is refused. | `git push --dry-run` |
| P2 | `bradludington-ui/orbit-review-mcp` | Attached to this session and cloned at `/home/user/orbit-review-mcp`. | `get_session` |
| P3 | GitHub API | REST through the `mcp__github__*` tools works (branches, PRs, tags). `gh` and GraphQL were not tested; v2.08 found GraphQL refused. | — |
| P4 | Environment | `env_01TABfDTVRXVJvQvBaTXZ64y`, as in §3. WebSearch works; WebFetch and curl to outside hosts are refused by policy. | `nproc` |
| P5 | Permission mode | auto, with draft PRs created automatically (`config:auto-create-pr:draft`). | `get_session` |
| P6 | Routines | On Brad's account. Their attached repository is still the old URL: the 1 Nov nightly checked out to `/home/user/spmt-prioritization-board` and unshallowed first. Only the Routine editor on claude.ai can change that (Brad). Harmless. | the 1 Nov report |
| P7 | Codex | State unknown. Ask for diffs inline. | Brad |
| P8 | Files outside git | The OCIO evidence zip (built at `f616daa`), the POA&M PDF (WO59515), `build_pdf.py`, and the Azure plan drafts. All CUI. Brad holds them. No branch head carries a pdf, zip or POA&M file. | `ls-tree` over 24 heads |
| P9 | Repository settings | Brad only. The session's GitHub token is Brad's own account (`get_me` login `bradludington-ui`), so anything a session merges or pushes is recorded under his name. `merged_by: bradludington-ui` on #30 therefore cannot show that Brad merged it himself (he did not: the lead merged it on his "Merge", header fact 1). (The "admin" report is from the v2.08 handoff, `recovery/v208/HANDOFF.md:72`, and was not re-checked; `get_me` reports no permission field.) All 24 branches, `main` among them, show `protected:false`. | `list_branches`, `get_me` |

## 5. Routines (`list_triggers`, 2 Nov)

| Routine | When (UTC) | Last run | What to know |
|---|---|---|---|
| Nightly ORBIT math validation (no sweep), `trig_01MNk6Db7rBPGhnxChGUXkMu` | 07:00 daily | 1 Nov on `bbb7ee9`, session `cse_01XFu2tzZYSWP1Y7WFHYBXyc`, report at 07:52. About 49 min; failed only the carried D ×8; suites 39.5 min; fuzz seed 77319738. | Its prompt (edited 20 Oct) still says **"2,021 targets"** (now 3,149) and "45–75 minutes" (measured 49–51). It names no watcher timeout: on 1 Nov the run happened to set `timeout: 7200000` itself, and without that a background job stops at 30 min. **A failing stage prints only its last 40 lines to the log** (`validate-math.mjs:217-221`; the tail is `s.out.split('\n').slice(-40)` at :220, and the report keeps `s.out.slice(-20000)` at :207). On 1 Nov the log's failure list was blank, and the 8 D results were matched from the report JSON, which keeps 20,000 characters. |
| Nightly ORBIT data-loss fuzz, `trig_01RAstTxNdkTfJYrZrA2dJyv` | 09:00 daily | 1 Nov 09:06 on `bbb7ee9`, session `cse_01XFu2tw6H2anwSSjuUcatia`: 12 boards clean, seed 497643842, 54 containers. | The prompt lists 5 trips; the tool runs 7. |
| Weekly ORBIT Interface Review, `trig_01DuixcCjkGaHDJw6JtTCK5o` | Mon 08:00 | 26 Oct 08:12 on `f508fdb` (v2.07), session `cse_018LjiDGJ3Yo3Zq8FDCRawDn`: `standards` 0 findings, census 15 menus and 101 items. `ia:shots` timed out on 02-scoreboard, 06-menu-basis and 07-menu-modetools. | It is the **only** automatic run of `standards`. Its theme is ISO week mod 7. Its recommendation: rename one side of the duplicate labels (Chart of Accounts: Reports and Setup; ACE Tie-Out: Reports and Data). |
| ORBIT v2.13 handoff check-in | one-shot | `trig_014ZUATQRVpUiAy5Y8jqRHiY` fired 02:29:11 and `trig_01PiAC9ySc2d4uYNMXEnrRzD` 03:20:18, each re-arming the next; the last, `trig_01H9WbaFPzEajvb22o64Vvo6` (due 04:01), was deleted unfired once the workflow finished | None remains (§0). |
| v2.00 overnight check-in (hourly), `trig_01PhhHK97YTPeEsCZr3X2fvw` | disabled | 19 Oct | Obsolete; deleting it is Brad's call (§8, item 29). |

Brad's family Routines ("Ludington Around Town research", "Ludington Family calendar sync") are not ORBIT's. Leave them alone.

**Read a run from its session, never from the trigger.** Use `list_events(<last_run.session_id>, kinds:["result"])` (the ids
are in the table) and take the last result. The nightly's `last_run` reads SUCCEEDED, `finished_at` 07:03, but that was its
first turn ("The run is going"). The report came 49 minutes later. SUCCEEDED means the wake was delivered, not that the gate
passed.

**Not Routines.** `.agents/monitoring/` on `main` defines four read-only reviewers: `data-preservation-reviewer.md`,
`money-reviewer.md`, `regression-monitor.md` and `environment-acceptance-reviewer.md` (last changed `0d5414b`, 9 Oct). Their
recurring tasks are configured in Brad's ChatGPT, so `list_triggers` cannot see them, and their reports go to him
(`recovery/v208/HANDOFF.md:85-88`). `WORK-ASSIGNMENTS.md:84` still says "The four recurring monitors retain read-only scope".
Whether they still run is unknown: ask him. If they do, they will review the handoff PR and every v2.13 PR head.

## 6. Carry-forward: every open item of the v2.08 handoff, and its state now

"The ledger", wherever this file says it, is `recovery/v200/UNRESOLVED-LEDGER.md`, last changed `67bc4de` (19 Oct 2026); its
rows U63 and U64 are at lines 96 and 97.

| v2.08 # | What it was | Now | Evidence |
|---|---|---|---|
| F1, F3, F5, F6, F7, absorber | Band clear deletes the impact statement; same office re-ranks; a copy's rename never sent; CLIN drill editable in a copy; ↳ USAF label shared; absorber not refused in a copy | **All closed in v2.08** (the repro is recorded GONE, `NEXT-VERSION.md:1536-1537`; not re-run here) | `setBand` board:23087; `setGrp` :6659-6662; `S.titles[id]` :35749, `pmoVal` :8272; `clinLocked` :28715; `rcnSvc\|` :29371, `bud\|` :29559; `allocLocked` :3460, :3466 |
| F2 | A redraw replaces typing | **Closed in v2.08**; v2.09 extended it to the rows | `inspHeld` board:38088, `inspHeldBack` :38095, `__pend` on `#inspector, #list` :38059 |
| F4 | Second hop and MIPR kept after the type changes | **Closed in code in v2.08.** Its defect-register entry was never added. | `destOf` board:19240, `miprOf` :19250; `math-defects.json` has 13 entries, none for F4 |
| bulk set | Classify's Prime/OGC and cost element write directly | Unchanged, and not a defect (fixed lists). v2.12's bulk WBS does the same. | board:29508, :29547, :29544 |
| U63 | A Live refresh writes over work saved only in the file | **Open.** `driveStorePull` is byte-identical to v2.07's. | function-body comparison `f508fdb` vs `fe0c83d`; `recovery/v200/UNRESOLVED-LEDGER.md:96` |
| U64 | Put this back does the same, and its status line is wrong | **Open.** Unchanged; the text is still at board:33004. | `recovery/v200/UNRESOLVED-LEDGER.md:97` |
| §1 | `orbit-review-mcp` probably live | Unchanged. Idle since 10 Oct. | §8, item 35 |
| A1 | Read the first nightly etc. on v2.07 | **Overtaken.** Verified clean apart from D ×8 only for the 1 Nov 07:00 UTC run on `bbb7ee9` ("The only failure is the 8 carried layout results"; 25/25 coverage, 308/112/195/1, trace 77, fuzz seed 77319738). The 26–31 Oct Routine runs cannot be read from here: `list_triggers` gives only `last_run`, and trigger-fired sessions are not listed. The "27 Oct nightly" that died with exit 134 (fixed by `a4422f3`) was the in-session gate on v2.09's tree, run before v2.09 merged (`a4422f3` 12:11 UTC, the `89466fa` merge 13:37 UTC), so it was not a Routine run on `main`. None has run on v2.12 yet (§0). | `list_events(cse_01XFu2tzZYSWP1Y7WFHYBXyc, kinds:["result"])`, result at 07:52:38Z |
| A2 | The sweep | **Open, and grown**: 2,166 targets never swept on a merged tree (20 of the v2.00/v2.01 ones only in the 20 Oct pilot, ids lost) | §7 A2 |
| A3 | Acceptance in the real environment | **Open.** None recorded (Excel, CCaR, IDS, 1A9A, native Edge, File System Access, two writers, `verify:file`). Real-world input since: Brad's 26 Oct requests for items 125–128 came from using the board (item 125 quotes him hitting the defect: "if I click a requirement amount on a CLIN, it sends me to the panel pop up and I'm unable to edit CLIN requirement amounts"; item 126: "if the base year is FY28, I cannot add requirements to FY29-FY32"), and his PB27 slide photos (item 130, 27 Oct) came after. | `NEXT-VERSION.md:1270` (125), `:1340` (126), `:1041` (130) |
| A4 | Independent review of v2.03–v2.05 | **Open.** None recorded. | grep |
| A5 | A lock keeps `it.prior` links | **Open.** No check. | `NEXT-VERSION.md:1898` |
| B0 | v2.08 owner and scope | `WORK-ASSIGNMENTS.md` was updated for v2.08 (`29170cc`) and v2.12 (`d732259`, `e6da1de`) only: it said v2.08 "editing" while v2.09–v2.11 merged. The commit carrying this file closes the v2.12 entry (merged on Brad's "Merge"); no v2.13 owner is named. | `git log -- WORK-ASSIGNMENTS.md` |
| B1, B12 | Item 122's twelve decisions; merge #25 and close the old drafts | **Closed.** 26 Oct, "Agree on all, D9 retire the rename", built in v2.08; #25 merged 26 Oct. | `NEXT-VERSION.md:1658`; GitHub |
| §1 queued 123 | Refresh the security review kit | **Closed.** Shipped in v2.08 (`SECURITY-REVIEW.md` rewritten, `tools/review/`, `review/builds.json` naming v2.00–v2.08 with v2.08 at its branch commit `f416366`). Its refresh for v2.09–v2.12 is §7 C13 / §8 item 37. | `recovery/v208/HANDOFF.md:56`; `NEXT-VERSION.md:1520`; `review/builds.json` (last entry `f4163660`) |
| B2 | Fix F1–F7 | **Partly closed.** F1–F7 are fixed. Still open: U35 (F2's class) and F4's register entry. | above; §7 A7 |
| B3 | U63 / U64 | **Open.** No answer. | — |
| B4 | Item 112's Allocated column and own-office tabs | **Open.** No answer. | grep |
| B5 | The guide's five-year text describes the pre-v2.04 workbook | **Open.** | board:2197, :2315 |
| B6 | Priority Drill `###` columns | **Open.** | — |
| B7 | Sweep go | **Open.** The v2.12 assignment says "no named go". | `WORK-ASSIGNMENTS.md:39` |
| B8 | Ledger rows needing a decision | **Open.** Not re-checked; the ledger is unchanged since 19 Oct (`67bc4de`). The list is carried in §8 item 21. | `recovery/v208/HANDOFF.md:174` |
| B9–B11 | Items 71, 84, 82 | **Open.** Bullets still unstruck. | `NEXT-VERSION.md:24-89` |
| B13 | Where people open the board; a release tag | **Open.** No tags exist. | `git ls-remote --tags` empty |
| B14 | v2.07's five build choices | **Open, and grown**: v2.08, v2.09, v2.10 and v2.12 each added an unconfirmed list | §8, item 10 |
| B15 | Trend report over year links; positions diff | **Open.** Not logged as items. | grep |
| B16 | Delete the v2.00 check-in Routine | **Open.** It still exists, disabled. | `list_triggers` |
| C1 | `verify:grid` stops at layout | **Open, and worse.** 7 checks sit behind layout's carried D ×8 and never run in it or at night: `keys`, `dropdowns`, `dialogs`, `leftmenu`, `pmosave`, `pmoyears`, `pointer`. `standards` is not in the chain. | `package.json`; `validate-math.mjs:145` |
| C2 | Heap for recon and import | **Partly closed.** `validate:nightly` gives the suites 8 GB (`a4422f3`). `package.json` sets none for `audit:board`, `audit:recon` or `audit:import`. | `validate-math.mjs:129-131` |
| C3 | `money-coverage` reads single-quoted ids only | **Open.** It parses 1,757 of 3,149 entries: of the 1,939 single-quoted ones (§3), only those whose `find` is a quoted string that parses (113 have none it can read, 72 fail the parse; a text replay of its loop). | `money-coverage.mjs:129-135` |
| C4 | `aiExport` × Fiscal year | **Open.** The only open money-map cell. | `tools/money-map.md:89-94` |
| C5 | Stale prose | **Open.** One item done: `CLAUDE.md`'s v2.12 section has a current money-map line (`:4934`). | §7 C5 |
| C6 | `-I -B` and *Before every commit* | **Open.** `PYTHONDONTWRITEBYTECODE` does not help under `-I`. | §1, item 7 |
| C7 | `NEXT-VERSION.md` clean-up | **Open.** | §7 C7 |
| C8 | Ledger record since 19 Oct | **Open.** The list is carried in §7 C8. | `recovery/v208/HANDOFF.md:195` |
| C9 | `BACKLOG.md` names `addReq`, `rowChipsHtml` | **Open.** | `BACKLOG.md:19, 33, 60, 203` |
| C10 | Test gaps | **Partly closed.** The hostile sweep now opens the edit box (`tools/export-audit/hostile.mjs:226`, `editPanel` in `SPECIAL`), and `standards` opens 7 of the 51 boxes. Still open: `dropdowns` docks only at 1536 and 1920; `dropdowns-visible` still scrolls every item into view (`e.scrollIntoView` at `tools/dropdowns-visible.mjs:57` and `:136`; unchanged since `439716b`, 19 Oct), so a menu that cannot scroll can still pass; nothing counts targets at night; `ia-shots`. | §7 C10 |
| C11 | `recovery/v200/bin` runners name `audit-ppt` | **Open.** | grep |
| C12 | Rules written only in handoffs | **Open, and grown**: no v2.09–v2.12 rule reached `AGENTS.md` (last changed `65cc26a`, v2.08). | grep |
| D | layout D ×8 (first requirement 323 / 420 px down; the check wants under 320) | **Still carried** (Brad, 18 Oct). Any other browser failure is real. | `layout-fits.mjs:270` |
| E0 | Interim pilot restrictions in effect (23 Oct) | **Unknown.** Brad's own words are on record (21 Oct: "the interim pilot restrictions stand for now"; "The file keeps running as the pilot under the interim restrictions"). What is not on record is confirmation of the 23 Oct POA&M milestone, that they are in effect. | `NEXT-VERSION.md:95-96`, `:107-108` |
| E1 | 6 Nov: package and hardening | **Open.** `main` is unprotected and the list is not on record. | §8, items 33–35 |
| E2, E3 | 20 Nov, 18 Dec | Ahead. Nothing recorded. | — |
| E4 | Security team's questions | **Partly.** A CUI mark ships in v2.10's FYDP Disconnects workbook, worded by Brad (board:25833). The rest are unanswered on record: GenAI.mil (§8 item 36), the CUI wording (item 39), and the deployment and Azure questions (item 40). | §8, items 36, 39, 40; `recovery/v208/HANDOFF.md:215` |
| E5 | Item 106's remainder | **Open** (Later). It still lists the CSP and Clear this computer, both shipped in v2.04. | `NEXT-VERSION.md:354-367` |
| branches | Unmerged heads to keep read-only | `ccr-f11beb69` (v2.03 handoff), `ccr-1ca5beab` (v2.04 handoff) and `ccr-c0857c07` (`HANDOFF-v2.05.md`): none of these files is on `main`. `ccr-24c317db` (v2.02 handoff rewrite; 13 lines differ from `main`'s). `claude/v200-fixes-wip` (the v2.00 gate runbook, `codex-handoff-4`, `build_evidence.sh`). `codex/v200-reports-*` ×2 (`codex-reports/`). `claude/security-review-kit` (Brad: keep). Superseded (their content is on `main` in another form): `ccr-25fa8f75` (squash `db41c0a`), `ccr-ce1f5388` (#25, #26), `claude/orbit-v1.94` (`git cherry` marks it `-`). | `git cherry`, `ls-tree` |

## 7. Tracker: open actions

Owners: **C** = the Claude lead, **B** = Brad, **S** = the security team. Decisions are in §8; this section lists work.

**A. Verification**

| # | Action | Owner | Next step |
|---|---|---|---|
| A1 | Read the first v2.12 nightly, Interface Review and fuzz (§0). | C | Anything beyond the 8 D results, or any figure off §0's list, is real: log it. The report JSON (`.math-reports/math-<stamp>.json`) lives in the Routine's own fresh container (`persist_session:false`) and is gone when the run ends; the lead sees only what the Routine wrote in its session (`list_events`). The nightly prompt says "read the whole log once: `cat /tmp/validate-nightly.log`" and does not mention the JSON (on 1 Nov it read the JSON of its own accord). Read the Routine's result from its session; if the failing lines are not in it, run `validate:nightly` yourself and read the JSON it writes. Or ask Brad to add "read the report JSON" to the prompt (§8 item 28). |
| A2 | **The sweep.** 2,166 targets have never been swept on a merged tree (20 of the v2.00/v2.01 ones only in the 20 Oct pilot, on a pre-merge v2.01-era tree, all 20 caught; their ids were not kept, `NEXT-VERSION.md:3214-3218`, `recovery/v202/HANDOFF.md:151`): 2,088 new ids from v2.00 to v2.12 (v200 869, v201 2, v202 89, v203 14, v204 46, v205 15, v206 54, v207 154, v208 86, v209 261, v210 133, v211 15, v212 350) plus 78 retargeted. The other 983 were last swept on the v1.99 board, against suites since cut. **Time, extrapolated:** the only measurement is the 20 Oct pilot, 89 min for 22 hard targets at 4 jobs, about 4 min a target. That suggests about 144 h for the 2,166 and about 210 h for all 3,149. | B (go), C | Use `sweep-shards.mjs`, **not** `validate:math`: its sweep is the old `mutate.mjs` runner, whose 2.5 GB cap CRASHED big blocks, and whose suite list omits `legacy-fsrc` (`mutate.mjs:20-54`). Recalibrate first: no calibration exists on disk, and the tools changed after `sweep-shards.mjs` last did. Fix its `-I` spawn (§1, item 7) or restore the `.pyc` afterwards. Commands in §13. Measure the first 100 before quoting hours. A run this long only survives as saved batches with the watcher re-armed on each wake (§13, "Long runs here"). |
| A3 | Acceptance in the real environment: Excel, CCaR, the IDS import, the 1A9A, native Edge, File System Access saves, the shared folder with two writers, and `verify:file` on the board he briefs from. **Added since the v2.08 handoff, none of it recorded as tried with real files or machines:** (a) **a real cost estimate through v2.12's import by header titles.** It was built from Brad's 28 Oct screenshots of the header row, titles only (`NEXT-VERSION.md:775`); its fixtures are titled synthetic sheets, and W2 records that "the 2026 estimate's real names have not been seen" and that layout Q's long WBS names are invented (`recovery/v212/notes-W2.md:178-180`). Check that the report ties (kept plus every reason equals the sheet), the tree and its lettered branches, and that the real names fit the edit box (about 85 characters with every RCN / EEIC row open). Item 133 stands on this tree. (b) **CCaR taking the Spend Plan Source's column 23 as `CODE - name`** (v2.12, `NEXT-VERSION.md:457`). (c) **The FYDP Disconnects workbook opened in Excel beside Brad's PB27 slides**; it was rendered only in LibreOffice (`NEXT-VERSION.md:958`). (d) **A PMO copy's Save on a real machine** (File System Access, the handle in `prio-fh` under `pmo-copy|…`); `npm run pmosave` stubs `showSaveFilePicker` (`tools/pmo-save.mjs:115`). (e) **Whether Brad's team has added the WBS paragraph to every CCaR plan event** (`NEXT-VERSION.md:227`): item 133's active year comes from CCaR only, and needs that paragraph to put CCaR rows on the WBS tree. A grep of v2.12's Shipped section (`NEXT-VERSION.md:408-720`) finds no record of a real estimate being imported; that is not proof none was (unverified beyond the repository). | B, C | C writes a one-page checklist; one session with Brad at a work machine. |
| A4 | Independent review of v2.03–v2.05 (code removed by a call graph, the CSP, `aiImport`, the five-year workbook). | C | One review scoped to data loss and the import door. |
| A5 | A check that a lock keeps `it.prior` links. | C | One audit-board block, with its mutation. |
| A6 | **Prove the retargets that have no record on their current text: 12, all from v2.07 and v2.08.** v2.07's seven: `proposal-gate-open`, `add-total-divides`, `add-total-rounds-each`, `add-total-leftover-last`, `add-whole-refusal-gone`, `v197w1-guard-addReq`, `v206-117-no-link`. v2.08's five: `mipr-no-bulk-setter`, `v199-mat-preview-clinown`, `v199-mat-rcnnote-gone`, `v200-u44-awards-bulk-every`, `v203-20-recf-label-raw`. Each one's find/repl changed at its version's boundary (`9362931`→`f508fdb`, `f508fdb`→`6405e01`), is unchanged since, and is in no `*proved*.jsonl`. (v2.07's eighth, `v199-newreq-ccar-cut`, changed again and has `recovery/v212/proved-INT.jsonl`.) Every v2.09 retarget has a v2.09-or-later record (23 entries by one text parse of `6405e01` vs `89466fa`, 24 by another that ignores whole-line comments differently; none lacks one), as do v2.11's 1 and v2.12's 14. An earlier draft named five other ids here; none of them was retargeted since v2.07. `v208-f2-keyboard-lost` was re-proved against its changed check in v2.09 W1, recorded in prose only (`recovery/v209/notes-W1.md:123-124`). | C | `prove.py` with a `caughtBy` for each. |
| A7 | **The defect register stopped at 23 Sep** (newest entry dated 19 Sep; the file last changed at `84dcaf9`, 23 Sep). At least these shipped money defects have no entry: F4 (money under the wrong destination); v1.97's Two Spend Plans funding a service above its ask; v1.99 item 85 (`apportion` put a dollar on the wrong service when two remainders were close); v1.95 F6 (a prime's CLIN lines on the Spend Plan Source and the RCN/EEIC tab were amount × share, $33.333…); v2.02 D3 (office-by-month cells measured up to $2.56 off). | C | An entry each, written as the symptom was seen, with its check and mutations. |

**C. Docs and tools** (no board change; each once Brad assigns it, one commit each, shown to him as a diff)

| # | What | Fix |
|---|---|---|
| C1 | `verify:grid` order (§6) | Run the 7 checks and `standards` before `layout`, or have `layout` exempt D by name. Until then, run them by hand after any change to menus, boxes, saves or pointer paths. They last ran on `d630240`, which has the same board as `main`. |
| C2 | No heap in `package.json` | Add `--max-old-space-size=8192` to `audit:board`, `audit:recon` and `audit:import`. |
| C3 | `money-coverage.mjs`, `math-defects.mjs` read only `id: '…'` | Read entries as `mcread.py` does. Prove it on a planted double-quoted id. Never rewrite the ids. |
| C4 | `aiExport` × Fiscal year | A second held year in the item 109 block, or n/a with a reason. |
| C5 | Stale numbers. **`CLAUDE.md`:** `:4` (size), `:1046` and `:1993-1995` (banners: healthy is 8 plus legacy), `:1883-1909` (the gate cost section: two builds, parity, `audit-ppt`), `:1472` (trace "60 cells", deck tables), `:1402-1416` (the review's name, cadence and gate), `:2009` ("2,021"), `:2192-2230` (v1.31 line numbers), `:4236` (replaces `NODE_OPTIONS`), `:4926-4927` (says `c81e995` is "not yet on main"; it is). **`AGENTS.md`:** `:9`, `:40`, `:41` (verify:grid "exit 0"), `:44` (2,021; `validate:math` as the gate), `:50` (`-I`), `:55-57` (calls counting every target "the gate's first step": no stage of `validate:nightly`, the gate the Routine and §12 run, counts targets; in the full `validate:math` only the last stage, the sweep, reports a target that matches nothing as NOT APPLIED, `validate-math.mjs:11`, `:181`). **`README.md`:** `:18`, `:26`, `:34`, `:37`, `:85-86`, `:89`. (`WORK-ASSIGNMENTS.md:44-45` and `:82` are corrected by this file's commit.) **The nightly prompt:** 2,021, the watcher timeout, 45–75 min (Brad's OK). | One docs pass. |
| C6 | Bytecode | `CLAUDE.md:2004`, `AGENTS.md:50` and `mut-json.py:3-4` say `-I`. `sweep-shards.mjs:79` spawns `-I` without `-B`. `recovery/item133-mockup/make.sh` runs `python3 -I` (lines 7, 10); the item 130 mock-up (`recovery/v210/item130-mockup/`) has no `make.sh` and never had one. Two `.pyc` files are tracked: `recovery/v200/bin/__pycache__/mcread.cpython-313.pyc` (the one `-I` rewrites) and `recovery/v200/evidence/L3-u13/lateguard-review/h/__pycache__/summarize.cpython-311.pyc`. Make every one `-I -B`, untrack both `.pyc` files and add a `__pycache__/` line to `.gitignore` (it has none, so a regenerated file would show as untracked), and add unshallow and the heap to *Before every commit*. |
| C7 | `NEXT-VERSION.md` | Strike done bullets in 63, 71, 82 and 84, naming the item that closed each (v2.02 D3, D4, D5a, D5c, D6a, D6b). 106 lists shipped work. "485 planted mistakes" (`:380`). The card-era note (`:389-391`). The bare `GATE_V200` (`:3294`). Item 129's "held for v2.10" heading. Item 133's two stale build notes (§9). |
| C8 | Ledger (`recovery/v200/UNRESOLVED-LEDGER.md`) | Closed but not recorded as closed: U9, U9L, U15, U24, U29, U31, U43, U47, U51, U52, U53, U60, U62, U72. Fixed and still marked "closed when the lead integrates": U41, U42, U56–U59. U17 probably closed (by inference). UI-MENU overtaken by v2.05. U28 not reproduced: ask Brad to close it (its Windows part is A3). Still open: U63 / U64 (§8 item 14), the B8 rows (§8 item 21), U14's last question, U18's and U61's residuals, U69 and U40's named limit (re-measure: item 89 may have narrowed them), U11 (its `driveRpPush` part is gone) and U12. Source: `recovery/v208/HANDOFF.md:195`; the ledger is unchanged since, so the list still describes it. Re-check each on `fe0c83d`, then one ledger commit. |
| C9 | `BACKLOG.md` | Mark `addReq` and `rowChipsHtml` gone, and entry 9 superseded by item 112. |
| C10 | Test gaps | `ia-shots.mjs`: 13 shots, not 16; it photographs hidden `m_*` menus and never the left menu (the census does read it). `dropdowns` docks only at 1536 and 1920. Nothing counts mutation targets at night: add `mcount` as a nightly stage. The nightly log's 40-line tail (§5). |
| C11 | `recovery/v200/bin` shell runners name `audit-ppt` | Use only `mkmut.py`, `mcount.py` and `mcread.py` from there. |
| C12 | Rules only in handoffs and version sections | Move §10's rules 1–2, 6–7 and 9–11, and the v2.09–v2.12 rules in §11, into `AGENTS.md`. |
| C13 | Security kit (`review/builds.json`, `SECURITY-REVIEW.md`) | After §8 item 37: add v2.09–v2.12, fix lines 35 and 142 (§8 item 37: they describe candidate `3898d95`) and line 226 (a separate fault: its "a scanner's "board.js line 10756" is board line 10733" contradicts line 225's "line N of each is line N of the board"), and describe v2.09–v2.12. |

**E. Security and OCIO**: see §8, items 33–40. **In flight**: nothing. The handoff workflow has finished and no check-in Routine remains. No ORBIT test, prover, fuzz or sweep process is running.

## 8. Decisions waiting on Brad: answer by number

Each item gives the recommended answer first (**bold**), then why.

**A. v2.12's eight questions** (`NEXT-VERSION.md:624-640`)
1. A CLIN request that is not a list reads as nothing, silently (S10). **Report it on opening, as repaired awards are.** A figure
   that disappears unsaid breaks "every word on screen stays true".
2. WBS from execution: a row naming a carried paragraph plus one more stays a conflict set by hand (S16). **Keep it.** An
   automatic pick would hide the other paragraph.
3. A prime switched to OGC, or back, claims no AV + PSM line until its WBS is reset (S11). **Confirm**: a prime's is per CLIN.
4. A heading placed under two parents goes under the breakout heading, named (S02). **Confirm.**
5. A `($M)` units row is now data, left out as "Another dollar type" ($0) (S01). **Confirm.** It is named and moves no dollar.
6. "2026 ACE vs 2027 ACE" is keyed by the later year (S00). **Confirm**, unless your files ever name the older estimate second.
7. "Keep my lane split" also governs Take from a PPBE position and FYDP Disconnects. **Confirm.** One rule in one place
   (`ppLanesOf`) is how v2.12 stopped those two disagreeing with the live budget.
8. FYDP Disconnects prints — for Disc and Mand of a one-figure position in a year with no plan. **Yes.** It never guesses a
   split, and a position typed split fills it.

**B. Choices made in the build, never asked** (confirm or reverse each list as a batch)

9. v2.12's 15 "Decided in the build" points (`:594-623`) and the builders' points (`:440-491`). **Confirm**, but read this one
   first: opening a tagged board reads every year from its position silently, so a board saved by v2.11 under a tag with a
   logged position opens with its budget authority, and so its funded figures, moved to the position (`:617-620`). An
   untagged v2.11 board, or one whose tag has no logged position, keeps its own base. The reviews raised it and refuted it as
   the rule asked for.
10. v2.10's six (`:988-998`: not offered in a PMO copy; a locked cycle view works; the band text on screen is navy; services
    match by name; one page tall as well as wide; the box never redraws under a figure being typed). Brad already confirmed
    the navy band (27 Oct, "Keep the band text navy", `:991-993`), so five are left. v2.09's per item (`:1128-1190`), v2.08's D12 and the rest (`:1538-1551`), and v2.07's five,
    including the budget waiver. **Confirm**, unless one reads wrong to you.

**C. Older build decisions still open**

**For items 11 and 13–16, start from the repro scripts, then make each a failing check.** Item 129's four findings are
reproduced by `recovery/v209/held/two-tabs/` (`s2-two-tabs.mjs`, `s3-two-tabs-board.mjs`) and `recovery/v209/held/years/js/`,
with outputs recorded on `ba3c294` and `d3ce17d` (`out-t*-*.txt`; `NEXT-VERSION.md:155-157`). Each reads a board path; build
one with `git show fe0c83d:prioritization-board-grid.html`. They were not re-run on v2.12. By code reading, these function
bodies are byte-identical between `d3ce17d` and `fe0c83d`, so each finding is very likely still present: `yearHas`,
`yearLinkOf`, `naFromHere`, `pmoPriorHere`, `loadCounted` (item 129); `jrnlSet`, `pmoVal` (item 124); `driveStorePull`,
`driveRestore` (U63, U64); `rcnBody` (U35); `fydpGather` (item 131). `save()` differs only by v2.12's `_fitCache=null` line
(a node read of both boards, re-run for this file). Also run `node recovery/v208/repro/found-on-main.mjs` once on `fe0c83d`:
it should print GONE for all of F1–F7 (`NEXT-VERSION.md:1536-1537`); it was not re-run for this file.

11. **Item 129** (`:151-181`), built in no version since it was "held for v2.10": the two-tab data loss (`save()` and
    `loadCounted()` gate on the cached `_baseDirty`, board:7782 and :7775) and three copy-stamp / same-work findings. **Build
    all four in v2.13**: all four touch the can't-fails. Two-tab: work recorded saved, then replaced with nothing kept aside.
    Twin rule: Roll forward skips a requirement, "so its value is missing from the next year". Chain walk: Cancel can leave
    the wrong requirement out of the year. Rolled added requirement: "The same work goes in twice, unnamed".
12. Item 129's call: seal a copy's plan key per office file? **Not now.** It moves every copy's saved work.
13. **Item 124** (`:139-149`): Put back lands by place, and a hand-chosen "no SI code" in a copy is never sent. **Build it in
    v2.13**, journalling by id.
14. **U63 / U64** (P1 data loss, unchanged since v2.07). **The ledger's fix**: keep work aside by U19's rule; U64 names where Save writes.
15. **U35**: the RCN/EEIC registry box redraws under typing (`rcnBody`, board:5922, no hold). **Extend F2's hold to it.**
16. **Item 131** (`:182-206`). **In v2.13, the strict folder read in `fydpGather`** (FYDP Disconnects' rule: only
    `NotFoundError` means no copy). Its other four bullets, each with a recommendation:
    (1) the FYDP Disconnects box left open while another tab saves: **later**, with a `storage` listener and an Export that
    refuses a moved model, as logged;
    (2) the workbook not saying why an appropriation's lines print —: **ask Brad**; he chose the note line only for the
    ungrouped service;
    (3) the Spruills and Locks by appropriation reading another appropriation from this browser alone: **with the strict read
    in v2.13**, by the same `fydpStoreFolder(…, true)` route FYDP Disconnects takes;
    (4) the house style's indents not drawn: **later, alone**, since every dressed workbook's styles change, and with them the
    byte checks.
17. **Item 135** (`:327-348`). **Fix its four gaps when v2.13 touches that code; leave its four calls as built**, including
    v2.02 E5's CLIN amounts (your 13 Oct rule: move no dollar).
    **v2.12's known limits are in no Open item: log them as item 136** (the next free number; 135 is the last,
    `grep -E '^#### [0-9]+\.' NEXT-VERSION.md`). Each is recorded only in `CLAUDE.md`, the Shipped section or
    `WORK-ASSIGNMENTS.md`: the ACE import is not refused in a PMO copy; positions edited in a PMO copy do not travel back
    (`NEXT-VERSION.md:641-645`), and since item 134 reads budget authority live from positions, an office would see its own
    edits move its budget while the board never gets them (an inference from those two facts); the edit box shows about 85
    characters of a WBS name with every RCN / EEIC row open; `attLists()` went from about 1 to about 10 ms, and a draw from
    about 680 to 750 ms; keyboard T stands in for a datalist pick, and RV4's tiebreak between two breakout parents (the first in
    code order) has no mutation (`WORK-ASSIGNMENTS.md:76-78`); v2.09's press record (`PTR`) still matches by handler alone, the
    class v2.09's reviews fixed for `focusMark` / `focusRestore` (`CLAUDE.md:4675-4680`; `NEXT-VERSION.md:1119` is only the
    build note).
18. **Item 112** (v2.08's B4, `recovery/v208/HANDOFF.md:170`; still open, §6), three parts.
    (a) The five-year workbook's "Allocated" prints the lane draw. **Rename it Funded**, as every surface calls d + m.
    (b) The own-office PMO tabs are not split by CLIN share. **Keep them as built, and know what it costs.** A prime is under
    its own office each year, as the five-year plan and the cycle comparison have filed each year since v1.95 (item 55, your
    Q2: "reported as that PMO in that year", `CLAUDE.md:3599`), and the PMO tabs, like the service tabs, add up to the
    appropriation tab (`NEXT-VERSION.md:2446-2449`). The cost: the board workbook's PMO Matrix and PMO tabs split a CLIN-backed
    prime across the offices owning its CLINs ("By PMO means one thing everywhere", `pmoSharesOf` / `pmoPartsOf`,
    `CLAUDE.md:1277-1280` and v1.95 F4 at `:3659`), so a shared prime's office totals differ between the two workbooks. That
    is a design choice to put to you, not to change silently.
    (c) Two as-built differences from the log. A held year with nothing prints 0.000 where the log said –: **keep 0.000**, since
    a dash already means "year not held", the board-wide "—, never 0" rule (`NEXT-VERSION.md:2461-2463`). A sheet wider than
    about two landscape pages prints across pages instead of shrinking to one page wide: **keep the house style's page rule.**
    The five-year workbook is house-styled (`buildXlsx(…, {house:true, …})`, board:23812), and the house fits a sheet to one
    page wide only while it still reads, printing a wider one across pages on purpose (board:30791-30796). FYDP Disconnects'
    `page` option is not a route here: `buildXlsx` reads `s.page` only on a sheet with no house style (board:30809). One page
    wide anyway would be a change to the house's threshold (board:30792), which moves every dressed workbook's page setup, and
    with it the byte checks; it moves no figure.
19. **The guide's five-year text** (board:2197, :2315) describes the pre-v2.04 workbook. **Rewrite it in v2.13.** The rewrite
    replaces the two stale paragraphs, about 1,090 characters of source text (board:2197 is 338 bytes, :2315 is 753), so it
    needs a larger budget only if the new text is more than about 50 characters longer than the old. Measure the rewritten
    guide in a booted board, and raise the budget on purpose only if it passes 70,000 (`audit-import.mjs:3424`).
20. **Priority Drill `###` columns**: its *unbanded* and TOTAL columns, which the report sized narrow and which can show ###
    in a narrow viewer, as before the v2.04 house style (`NEXT-VERSION.md:2490-2491`). **Widen them.**
21. **The ledger rows** (v2.08's B8, `recovery/v208/HANDOFF.md:174`; the ledger is `recovery/v200/UNRESOLVED-LEDGER.md`).
    **Re-check each on `fe0c83d`, then send one grouped list.** The rows needing your decision: U5, U6, U16, U21, U22, U23,
    U25, U26 (two status lines false after an autosave lands; re-measure), U27 (re-measure first), U35 (with F2; item 15),
    U38, U39, U45, U54, U55, U65, U66, U67, U70, U8, U48, U7; U19's one-slot trade-off (a newer file copy left only in Teams
    version history after HOLD ON → OK), to accept knowingly, and its six wording points; UI-m1, m2, m3 (its PMO-copy parts;
    the `addReq` part is gone), m4 and m7 (a lower-cased cycle label).
22. **Items 71, 84, 82.** **For 71**, fold the side-list window into the Azure build (107) and retire the sidecar unless an
    office uses it. **For 84 and 82**, ask whether D6a/D6b and v1.99's worked examples close them. For 82, also put the three
    bullets nobody decided, one line each (`NEXT-VERSION.md:55-62`; `recovery/v208/HANDOFF.md:177`): (i) a kept PPBE cycle
    fixes the services it holds (no move, rename or removal while kept); (ii) journal entries from before a service-list
    change can no longer be put back; (iii) `bmSeedFromPp` rounds each figure (v2.02 D5c) but does not apportion a fraction
    arriving in a file. Since v2.12, Take from a PPBE position reads `ppLanesOf`, which apportions a one-figure position
    (`CLAUDE.md:4848-4851`), so (iii) may now be partly closed: re-check it first.
23. **A trend report over year links, and a PPBE-positions diff.** **Log them** if you want them.
24. **A release tag.** **Tag `fe0c83d` as v2.12 on your word**, and say where people open the board: since v2.02, an older ORBIT
    refuses a newer file, so everyone moves together.

**D. Process**

25. **v2.13's owner and scope.** **The Claude lead: item 133, plus 11, 13–16 and 19.** Record it in `WORK-ASSIGNMENTS.md` first
    (v2.12's entry is already closed there).
26. **Item 133's go.** **Ask the CCaR-column question (§9) and the go in parallel; do not hold the go for CCaR's answer.**
    Only part of the build depends on it: the Spend Plan Source write, and reading a contract number back from the CCaR pull.
    The logged build adds the contract field and prints it in this workbook, and writes it to the Spend Plan Source only "once
    CCaR has a column for it" (`NEXT-VERSION.md:280-281`, `:290-292`).
27. **The sweep.** **A named go for a first batch of about 100** (v2.12's retargets and the newest ids) on `sweep-shards`, to
    measure. Decide the rest from that: at the pilot's rate, all 2,166 is about 144 h.
28. **Update the nightly prompt** (3,149 targets; `timeout: 7200000`; about 50 min). **Yes**: untimed, a watcher stops at 30 min.
29. **Delete the disabled v2.00 check-in Routine.** **Yes.**
30. **Clean-up.** **Remove the 15 `wf_*` worktrees and `v210-base`** (every head is an ancestor of `origin/main`). First clear
    the two that `git worktree remove` refuses without `--force`: in `wf_021ba697-b57-1`, restore the modified `.pyc`
    (`git -C <wt> checkout -- recovery/v200/bin/__pycache__`); in `v210-base`, delete the untracked
    `recovery/v210/item130-mockup/__pycache__/`. Then remove without `--force`; never reach for `--force` by habit. Keep
    `v212-int` until `v213-handoff` goes (§3), and also because its ignored `.math-reports/` holds the v2.12 gate reports cited
    in §3 (`math-2026-11-01-12-31-06.json`, `math-2026-11-01-13-11-03.json`). They are in no commit: copy them out before that
    worktree goes. Delete the three superseded branches. Keep the other unmerged branches read-only, or first carry their
    handoff files onto `main` under `recovery/`. Five sit on unmerged branches and not on `main` in that form. Four are missing
    entirely: `recovery/v203/HANDOFF.md` (`ccr-f11beb69`), `recovery/v204/HANDOFF.md` (`ccr-1ca5beab`), `HANDOFF-v2.05.md`
    (`ccr-c0857c07`) and `recovery/v200/HANDOFF-2026-10-20.md` (`claude/v200-fixes-wip`, with `FINAL-GATE-RUNBOOK.md`,
    `codex-handoff-4/` and `build_evidence.sh`). The fifth, the rewritten `recovery/v202/HANDOFF.md` (`ccr-24c317db`), differs
    from `main`'s by 13 lines.
31. **A docs-and-tools pass (§7 C).** **Yes**, as small reviewed commits.
32. **Merge this handoff** (records only) as a new PR. **Yes.** Unmerged handoffs went unread for three versions.

**E. Security and the dates** (§0)

33. **E1's hardening list, due 6 Nov.** This session never wrote or sent it (header, fact 2). Do you already have it, from an earlier
    session or your own? **If not, Claude writes it now and sends it by SendUserFile, not
    git**: branch protection, required review, signed commits, secret scanning and push protection, Dependabot alerts, and the
    `orbit-review-mcp` Worker and credentials. You apply it. (The tree has no `.github`, workflows or Dependabot config.
    *Unverified, general GitHub knowledge:* private repos on a personal account need a paid plan for protected branches and
    secret scanning; check yours before promising them to OCIO.)
34. **The evidence package stays at `f616daa`** (your 20 Oct decision). **Keep it**: a rebuild from `main` brings in the GenAI.mil
    export, which rule 9 keeps out. Know it is v2.01, with no CSP and a live-view client that can `fetch` a configured address,
    removed in v2.04. Check your copy's `DEPENDENCIES.txt`: git's only `build_evidence.sh` (`claude/v200-fixes-wip`, `:23`) always
    prints "Gap (POA&M P-05): there is no package-lock.json yet", though `f616daa` has `package-lock.json`. The 20 Oct v2.00
    handoff (`claude/v200-fixes-wip:recovery/v200/HANDOFF-2026-10-20.md:23-24`) says the package calls P-05 done, and names
    the package as built at `30cdcdd`, not `f616daa` (unverified here: the POA&M and the package are outside git).
35. **`orbit-review-mcp`**: private and idle since 10 Oct. Its deploy succeeded that day, but its README still says "pending" and
    lists `audit-ppt`. **Take it down and revoke** unless it is in use: `ORBIT_GITHUB_TOKEN` (repository secret and Worker
    secret), `ORBIT_OAUTH_CLIENT_SECRET` (the `GITHUB_OAUTH_CLIENT_SECRET` binding), and its KV and Durable Object stores.
36. **GenAI.mil.** "Export For GenAI.mil…" has no confirmation step (`aiExport`, board:36149-36159), while permission is still
    "Brad to confirm with the security team" (`NEXT-VERSION.md:2292`). **Ask them this week; if the answer is slow, add a confirm
    step in v2.13.**
37. **The security kit** stops at v2.08, so `which-build` cannot name v2.09–v2.12, though it is cited as OCIO evidence
    (`NEXT-VERSION.md:1724-1725`). `SECURITY-REVIEW.md` lines 35 and 142 describe candidate `3898d95`, not the `f416366` it names,
    and it names the AI review or GenAI.mil 21 times, on 16 lines (17 "AI review", 4 "GenAI.mil"; the v1.99 edition the team
    holds, `b6f1ffc`, never). **Refresh it for v2.12 (C13), then
    decide whether it goes to the team (weigh rule 9), whether the annex is refreshed, and whether `which-build` joins the checks.**
38. **E0.** On 21 Oct you wrote "the interim pilot restrictions stand for now" (`NEXT-VERSION.md:95-96`). Are they in effect,
    as the 23 Oct POA&M milestone needs? **Confirm the milestone in one line**, for the record.
39. **CUI wording.** FYDP Disconnects prints *CUI//REL TO US DoW*, from your slides, and item 133 will too. **Confirm the
    wording with the security team when E2 lands.**
40. **The security team's other open questions**, carried from v2.08's E4 and unanswered on record
    (`recovery/v208/HANDOFF.md:215`): the 15 deployment questions (`NEXT-VERSION.md:93`); the Azure plan's 8 questions for the
    security team (`:134`); which IL5 controls are inherited, and the Zero Trust target for this system (`:127`); the hosting
    date. Also unknown: whether the Azure plan's document 6 was sent (22 decisions; D-01, D-03, D-04, D-07, D-09 and D-10
    first). **Ask in one line whether document 6 and the questions went to the team**, and record the answer outside git (CUI).

## 9. Item 133: the Service share workbook (v2.13)

**What it is** (`NEXT-VERSION.md:208-326`, asked 28 Oct): one Excel product for everyone, for the joint PRR with the Services in
late December, putting requirement, cost share, contract and execution on one line by the ACE's WBS tree; it ends up on slides.
It stands on items 132 and 134, both shipped in v2.12. **No go is recorded.**

**Decided** (28 Oct; `:218-229`, answers `:306-324`): by the ACE's WBS tree; execution is obligations now, expenditures later; a
contract number per requirement, new in CCaR and ORBIT, never a MIPR number; cost share is each Service's % of funded, with a
typed partner-total box on every line that a header adds up, and ORBIT keeps no partner figures (that the box takes **$M** is
the mock-up's design, fixed after the 28 Oct review, `:243`, `:267`, not Brad's words); the budget year onward is planned
from ORBIT's funded figures within the PPBE position (134), and the active year is actuals plus planned from CCaR only; three
Services (Air Force = USAF, ANG, AFRC; Marine Corps = STOVL, USMC CV; Navy = USN CV) with six lines on the data tab ("proposed
28 Oct; Brad did not object", `:228-229`, not stated by him); what an
office types per paragraph is the allocation; OPN is in; earlier years' procurement obligating this year goes on the active tab,
marked; "Not allocated" in CCaR means not obligated; ORBIT's WBS goes into the Spend Plan Source; the mark is *CUI//REL TO US DoW*.

**Open:** (1) **which CCaR column carries the contract number** (`:325`). The pull is read by position (`SRC_NCOL` = 32,
board:14665; `QPE_READS` by index), so an inserted column re-points every later read and an appended one is dropped.
`SRC_HDR[23]` is "Spares WBS" (v2.12 writes the WBS there); `[30]` "Contract Mod" is the slot the notes suggest; agree it with
CCaR. (2) Which contract number a prime prints when its CLINs sit on different paragraphs (`:294-296`). (3) Whether CCaR was asked
to carry ORBIT's requirement id: not recorded. (4) Brad's go.

**Not built.** No contract-number field exists (`REQ_FIELD`, board:2860-2870). The proposed build (`:274-305`) adds one with the
full plumbing (`REQ_FIELD`, `recFields`, `REQ_MAPS`, `PMO_FIELDS`, `NA_FROM_CARRY`, the import door, `codeTake`), plus opt-in
formulas in `buildXlsx` (`{f, v}`, every other workbook byte-identical). **Traps already found:** `isAlloc` (board:18307) reads the
Spend Plan Source's own "Forecast allocated to a Plan Event" (`SRC_ALLOC_FORECAST`, board:14750) as obligated, so count obligated
only on a positive allocated value; 108 of 155 O&M requirements share a record name, so print plan event, record name and PID side
by side. Two build notes are stale against v2.12 (`:297-299`): the ACE is now searched on every sheet by title with whole dollars
at the door, and paragraph names come from CES1–CES8.

**The mock-up**: `recovery/item133-mockup/` (`model.py`, `xlsx.py`, `check.py`, `make.sh`, five PNG renders; no README; every
figure, name, CCaR and contract number invented). `check.py` recalculates in LibreOffice and prints ALL CHECKS PASSED or N
FAILING. Recorded, not re-run: 259 rows, and eleven planted mistakes each fail it; no script for those or for the PNGs is
committed. Stale against v2.12: `model.py`'s header calls the WBS names placeholders, `xlsx.py` has `NL = 5` levels (the ACE has
CES1–CES8), and its codes are numeric (`1.1.1.1E`) where real ones are lettered (`P6.2.2.1E`). `make.sh` writes into its own
folder with `python3 -I` and no `-B`, and builds in `${TMPDIR:-/tmp}/item133-mockup` (`rm -rf` first), outside the scratchpad.
It deletes its own folder's `__pycache__` at the end, but `set -e` skips that if `check.py` fails. So rebuild a copy, with
`$SCRATCH` defined first (nothing here defines it; unset, this copies to `/m133`):
`SCRATCH=<this session's scratchpad>/v213; mkdir -p "$SCRATCH"; cp -r recovery/item133-mockup "$SCRATCH/m133" &&
TMPDIR="$SCRATCH" sh "$SCRATCH/m133/make.sh"` (soffice 24.2.7.2 and openpyxl 3.1.5 are installed).

**A builder reads first:** item 133 (`NEXT-VERSION.md:208-326`); v2.12's Shipped entry (`:408-918`: the build notes are
408-707, "The items as logged", items 132 and 134, are 708-918) and `CLAUDE.md:4770-4939`;
`recovery/v212/contract.md` and `map.md` (the model contract and map); the mock-up's three Python files; `CLAUDE.md`'s "Reading a
workbook" and Spend Plan Source sections; and v2.10's FYDP Disconnects (`fdcSheets`, `FDC_MARK`, `buildXlsx`'s `heights`, `grid`,
`page`, `name`, `share`), the precedent for a slide-shaped workbook with the mark, which takes no house style (audit-other's v2.04
item 113 list).

**The byte-identity proof for a `buildXlsx` change is not in the repository.** v2.10 B proved that its opt-in options changed
no other workbook (536 boards, 279 workbooks compared, 0 differing) with a scratch loader hook that ran the old writer beside the
new one (`hook.mjs`, `loader.mjs`, `bxboot.mjs`, `mkold.py`, in a scratchpad that is gone). Item 133's opt-in `{f, v}` cells
(`NEXT-VERSION.md:282-284`: "every workbook that does not ask stays byte-for-byte as it is") need the same proof, so rebuild that
hook from `recovery/v210/notes-B.md:84-106`; under it U37's "one zip" checks read 2, because the hook writes each workbook twice.
For "which figures moved", use `npm run delta` (`tools/export-delta.mjs --ref fe0c83d`), as v2.04 did (`NEXT-VERSION.md:2492`).

## 10. Brad's standing rules

`CLAUDE.md` and `AGENTS.md` win where they speak, except one point: they still say `python3 -I` (`CLAUDE.md:2004`,
`AGENTS.md:50`). Until C6 lands, `-I -B` wins here. Rules 1–2, 6–7 and 9–11 are written only in handoffs (C12), except:
rule 1's merge/publish half (`AGENTS.md:217`), rule 2's can't-fails (`AGENTS.md:17-21`, "data loss and math"), and rule 7's
"a new check fails on the base" (`AGENTS.md:53-54`).

1. No merge, deploy or publish without Brad's go. Draft PRs are fine. Never force-push, and never rewrite history on a
   shared branch.
2. The can't-fails are data loss and money. Every word on screen must stay true.
3. The sweep runs only on his named go. During development, `mutate.mjs` is text only (`mkmut.py`, `mcount.py`, `prove.py`, all
   with `python3 -I -B`). Never import it; never run `npm run mutate` or `validate:math`. `validate:nightly` is fine at any time.
4. Changes ship as one version on "go": logged in `NEXT-VERSION.md` first, `BUILD` bumped once, pushed once.
5. Never `playwright install`. Never commit a populated board.
6. Each agent runs one heavy jsdom suite at a time (audit-board, audit-recon and audit-import alone, at 8 GB). At most two
   builders at once on this box, as v2.12's contract allowed (`recovery/v212/contract.md:220`). Run nothing beside
   `prove.py`, and one Chromium check at a time. `validate:nightly` needs no go but is itself a heavy job: run it alone.
7. Expected values are hand-written literals. A new check fails on the base and passes on the fix; a CONTROL passes on the base
   and fails on its own mutant. Prove both.
8. Show only what changed: changed lines or a unified diff (21 Oct).
9. OCIO and Azure deliverables are CUI and never go into git. The OCIO response does not mention AI tools.
10. Ask with AskUserQuestion only while background work runs: it holds the turn.
11. Commits end with the session's attribution lines; GitHub comments end with the Claude Code footer; no model name in anything
    pushed beyond those lines.
12. (`AGENTS.md`) One editing agent at a time. Brad names the owner and scope. A finding is not permission to fix it. Run
    `npm run check` before every commit. Scheduled runs never commit or push. (`CLAUDE.md:2067`) Never edit a suite while a
    sweep runs; the closest `AGENTS.md` wording is `:51`, a sweep "runs on a committed tree that does not change while it runs".

## 11. Lessons from v2.08–v2.12: what happened, then the rule

| What happened | Rule | Written in |
|---|---|---|
| CLIN amounts could not be typed with the mouse; every browser check reached fields by focusing them (v2.09 item 125). | A check of a pointer path clicks with a real pointer (`page.mouse`). | `CLAUDE.md` v2.09 |
| The F2 check fired `change` after the redraw; Chromium fires it during `innerHTML` removal, so the mutation survived. | To stand in for an event jsdom does not fire, fire it where the browser does. | `CLAUDE.md` v2.08 |
| v2.08's nightly failed an older v1.84 check because `prove.py` runs only the blocks it names; v2.10's stopped in import because its fix round ran only the suites its checks live in. | Run every suite whole once on the integrated board before the gate. | `CLAUDE.md` v2.08 and v2.10 |
| Mutations proved on their own branch SURVIVED on the merged board (v2.09: 1; v2.12: 3). v2.10 never did the combined run (`proved-INT.jsonl` holds 2 of its 133). | Prove every mutation together on the merged board, and plan a round for what that finds: strengthen the check, never delete the mutation. | `CLAUDE.md` v2.09, v2.12 |
| W2 retargeted 5 mutations without proof. Twelve v2.07 and v2.08 retargets still have no record on their retargeted text (§7 A6). | A retarget is a new mutation and needs its own proof. | `CLAUDE.md` v2.12 |
| `v208-rv-f2-any-marked` was proved, then the code it targets was rewritten, and it survived. | A proof holds only for the board it ran on. | notes only |
| STOVL printed $0 Procurement controls because each sheet was checked alone (v2.10 A-1). | A sheet that should add up to another is checked by adding it up, both ways. | `CLAUDE.md` v2.10 |
| Fixtures that could not reach their target, several times in each version. | The alternatives must disagree, and a planted value must arrive intact where it is tested. | `CLAUDE.md` (older rule) |
| "A draw writes nothing" was snapshotted after many draws. | Measure before anything has run. | `CLAUDE.md` v2.12 |
| `pmosave` failed 6 of 7 runs. One failure had been dismissed as "a timing flake under load", and v2.11's 3 of 3 passes were luck: the unchanged check failed v2.11 4 of 6. | Never set storage from an init script. Never dismiss a flaky failure: rerun the unchanged check several times on the last release, and have a second agent try to refute the diagnosis. | `CLAUDE.md` v2.12 (the first rule); notes |
| After merges, an editor turned a `\u` escape into its character (two targets stopped matching), and a K5-pinned line was rewritten. | Run `mcount` and `audit-inject` after every merge. Add beside a pinned line on a line of its own. | `CLAUDE.md` v2.12; notes |
| Merged, the guide read 70,035 characters and the first v2.12 nightly failed. | Measure the guide in a booted board. The next addition trims it or raises the budget on purpose. | `CLAUDE.md` v2.12 |
| The PMO review offered agreed values as conflicts, because it compared them as stored. | Compare a field as it is read (`pmoBare`). | `CLAUDE.md` v2.08 |
| The journal filed an added requirement's fields by place. | File by id (the rest is item 124). | `CLAUDE.md` v2.08 |
| `focusRestore` found controls by class and index, so the keyboard landed on another requirement. | Find a control again by what names it, and only where its item still stands. | `CLAUDE.md` v2.09 |
| A link fallback matched more widely than its own rule. | A fallback looser than its rule is a defect waiting for its case. | `CLAUDE.md` v2.09 |
| A data-loss fix made every newer opening write storage. | The boot writes storage only where it has just kept work aside; each review round reviews the last round's fixes. | `CLAUDE.md` v2.09 (the boot rule). Reviewing the fixes is recorded as "A second review of those fixes" in v2.06, v2.07 and v2.08 (`CLAUDE.md:4367`, `:4477`, `:4545`), and v2.09's third review is at `NEXT-VERSION.md:1227-1236` |
| A folder copy mid-sync was read as "no copy". | Only `NotFoundError` means none. | `CLAUDE.md` v2.10 |
| R37's rule went into `baOf` alone, so Take and FYDP Disconnects disagreed with the live budget. | A rule written in two places is two rules (`ppLanesOf`). | `CLAUDE.md` v2.12 |
| Non-list shapes on the draw path opened the board blank. | The reader cannot throw; the door refuses the shape by name. | `CLAUDE.md` v2.12 |
| W1's first cut keyed the import report's counts by a file's text, which would have made a board holding a cell reading `constructor` refuse its own saved file (found while building it; it never shipped). | Whatever the board stores passes its own door. | notes (`recovery/v212/notes-W1.md:106-109`) |
| A third review kept finding older defects. | Ask Brad for scope ("Fix the regressions only", 27 Oct). | `NEXT-VERSION.md` |
| `WORK-ASSIGNMENTS.md` was not updated for v2.09–v2.11, and no handoff was written for them. | Update the assignment at each version, and close it at merge; write a handoff at each merge. | here |
| `.gitignore` takes `*.json`, so v2.10–v2.12's records needed `git add -f`. | Run `git check-ignore -v` before committing a new `.json` (for a file already tracked it prints nothing; use `git check-ignore --no-index -v`), and `git show --stat` after. | notes for the `git add -f` fact (`recovery/v210/notes-A.md:97`, `notes-B.md:135`, `recovery/v212/map.md:1327`); here for the rule |

## 12. The method that shipped v2.09–v2.12, as a runbook

v2.09 had four builders and three reviews (slot `6405e01`); v2.10 two builders to `item130-contract.md` (slot `35d0dd0`); v2.11 the
lead alone (`16f65f2`) and one review; v2.12 three builders, two reviews and six fixers, integrating on `v212-int`, apart from the
release branch. The worked example is v2.12's chain: `git log --first-parent --reverse d732259^..e6da1de`.

1. **Log, then wait.** The item goes into `NEXT-VERSION.md` › Open, committed alone. Nothing in the board changes until "go",
   which the Shipped heading quotes. **Assign** in `WORK-ASSIGNMENTS.md` from its template (owner, scope, branch, base SHA, gate
   owner) before any edit.
2. **Map and contract.** Read-only mappers write `recovery/v2NN/map.md`. `contract.md` fixes the shared shapes, who builds what,
   slot names, mutation-id prefixes, layout and keyboard letters, the notes template, proof files and "Decided in the build".
3. **Slot commit**: an empty slot per workstream in every suite and in `mutate.mjs` (`git show --stat d732259`).
4. **Builders**, each in its own worktree and branch from the slot. A builder never bumps `BUILD`, pushes, merges or touches
   another's slot. Add ids in your slot, single-quoted (`{ id: '…'`), each find matching once: `money-coverage` and
   `math-defects` read only that form (`recovery/v212/contract.md:217-218`, `CLAUDE.md:4240`, `math-defects.mjs:35`). It stops only after `npm run check`, its blocks, every suite it touched (whole), its browser checks and `mcount`,
   with `notes-Wn.md` (which checks fail on the slot), `proofs-Wn.json` and `proved-Wn.jsonl`, committed, not pushed.
5. **Integrate** on its own branch; `mcount` and `audit-inject` after each merge.
6. **Review**: finders by area or lens, each finding re-run by **two** skeptics, kept when its finder reproduced it and at least
   one skeptic held it (v2.12: 56 kept and 5 dropped, then 22 and 5). A finding against Brad's rule is refuted and listed for him.
   Commit the kept list (`review-*.json`). **Fixers** branch from that commit; each fix has a check that fails there, a mutation,
   `notes-RVn.md` and proofs. A second review covers the fixes.
7. **Prove each round**, one worktree per run, nothing beside it:
   `JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py recovery/v2NN/proofs-X.json recovery/v2NN/proved-X.jsonl [ids]`,
   entries `{id, caughtBy: "<suite> / <scenario substring>[; another]"}`. `NOT CLEAN` means the check fails unmutated; a block
   reading a top-level `let` another writes (`V14`, `V185W`, `V186L`, `W2FX`, `W2THEIRS`, `W3FILES`) needs the writer in
   `caughtBy`. Commit long runs part-way (`102c21b`). Use JOBS=1: `map.md:1407`'s `JOBS=2 HEAP=8192` breaks its own 12 GB rule.
   Confirm that each catch where a block threw also failed real checks.
8. **Prove together**: `proofs-INT.json` (the latest round wins per id) on the final board into `proved-INT.jsonl`. For a
   survivor, strengthen its check and say so on its line.
9. **Every suite whole**, one at a time (8 GB for board, recon and import: about 4–5, 18 and 19 min). **Bump `BUILD`** as its own
   commit (`85c1017`). **`validate:nightly`** on the final tree, detached with one watcher; fix and rerun. **The browser checks**
   `verify:grid` cannot reach, one at a time (`pmosave` 42–45 s, `pointer` about 6 min).
10. **Ship notes in one commit** (`e6da1de`): a `CLAUDE.md` version section with rules for the next change; `NEXT-VERSION.md`
    Shipped (built as decided, Decided in the build, Questions for Brad, Checks, Proved with, the items as logged) and the
    follow-up item; `WORK-ASSIGNMENTS.md`. **Draft PR, Brad's word, a merge commit.** Then a handoff, records only, its own PR.

## 13. Commands

- First define the scratch folder; nothing here or in the environment sets it (unset, `"$SCRATCH/vn.log"` is `/vn.log`):
  `SCRATCH=<this session's scratchpad directory>/v213; mkdir -p "$SCRATCH"`.
- One suite: `NODE_OPTIONS="$NODE_OPTIONS --max-old-space-size=8192" node tools/export-audit/audit-import.mjs` (recon and board
  the same; 4096 for the rest), alone.
- One block: `python3 -I -B recovery/v208/bin/slim.py tools/export-audit/<suite>.mjs tools/export-audit/_slim-x.mjs '<scenario>'`,
  run `_slim-x.mjs` with the heap above, then delete it. `_slim-x.mjs` is not git-ignored (only `_slim-prove-*.mjs` and
  `_shard-*.mjs` are, `.gitignore:56-57`) and enters `sweep-shards`' calibration hash (`calKey` hashes every `.mjs`/`.py` in
  `tools/export-audit/`, `sweep-shards.mjs:192-195`), so a leftover silently forces a recalibration (about 18 min): delete it,
  and any `_slim-prove-*` left by a killed `prove.py`, before a sweep and before `git status`. One mutant: `python3 -I -B recovery/v200/bin/mkmut.py
  tools/export-audit/mutate.mjs prioritization-board-grid.html <id> <out.html>`.
- The gate without the sweep: `setsid nohup npm run validate:nightly > "$SCRATCH/vn.log" 2>&1 & echo $!` (record the PID; it adds 8 GB
  for the suites itself), then one watcher with `run_in_background` and `timeout: 7200000` (the default is 30 min). The failing
  lines are in `.math-reports/math-<stamp>.json`, not the log's 40-line tail.
- After it: `npm run keys`, `dropdowns`, `dialogs`, `leftmenu`, `pmosave`, `pmoyears`, `pointer`, `standards` (0 findings), one at
  a time.
- A sweep, on a named go only: `node tools/export-audit/sweep-shards.mjs --calibrate-only --out <dir that survives restarts>`,
  then `… --ids FILE --out DIR --jobs 4`. It resumes from `DIR/results.jsonl`; commit or send that after each batch. It also
  takes `--plan-only` and `--recalibrate`.
- **Long runs here.** A background job and its watcher are capped at two hours (`timeout` max 7200000). A container restart ends
  even a `setsid nohup` job: v1.99's gate lost four six-hour single runs that way and was re-run as a restart-proof batch
  runner (`CLAUDE.md:3941`, `:2008`). So a sweep, whose estimate is about 144 h (§7 A2), runs only in saved batches, and the
  watcher is re-armed on each wake. Brad's 20 Oct go for sweeps said "be mindful of usage credits" (`NEXT-VERSION.md:3212`), and
  each wake re-reads the whole conversation: batch the work into few turns (`recovery/v202/HANDOFF.md` §7, "Working within the
  usage budget"). The lessons of v2.06–v2.07 and the older long-run mechanics are in `recovery/v208/HANDOFF.md` §8 and
  `recovery/v202/HANDOFF.md` §6–§7; §11 here covers v2.08–v2.12 only.
- **Read-only versus rewriting.** `node tools/money-map.mjs --check` writes nothing; `npm run money-map` rewrites
  `tools/money-map.md`, and `row-controls.mjs --record` rewrites `tools/row-controls.json`. `trace-matrix.mjs --emit` and
  `standards --emit` print a new baseline meant to be piped or pasted over the tracked `tools/trace-stated.json` and
  `tools/a11y-baseline.json`. Never run any of them on a read-only brief.
- Never `pkill -f` (it matches its own shell). End only PIDs you recorded.

## 14. A suggested order for v2.13 (a proposal; nothing in it is approved)

1. Read the three 2 Nov Routine reports (A1). Merge this handoff as a new PR (item 32) **before any v2.13 commit goes to
   `ccr-0b15d8d5-ypf61n`**, or build v2.13 on a branch of its own, named in `WORK-ASSIGNMENTS.md` (§0).
2. **Today:** confirm or write E1's hardening list and send it to Brad (item 33). 6 Nov is four days away.
3. One message to Brad with §8 to answer by number: the owner and scope (25), item 133's open points (26), the sweep batch (27),
   and v2.12's eight questions.
4. Once assigned: §7 C as small reviewed commits (docs and tools only). C1 and C6 first: they hide failures.
5. On go: item 133, plus 129, 124, U63/U64, U35, 131's strict and folder reads (item 16) and the guide text, each started
   from its repro (§8 C). Run it as §12, with two reviews with skeptics, the combined proof, the nightly, the browser checks by
   hand, and `mcount`.
6. The sweep batch, on its named go, then the real-environment session (A3) and the v2.03–v2.05 review (A4).

## 15. What this file does not know

- **Not re-run here:** v2.12's gate (§3 is from `NEXT-VERSION.md:704-706` and the v212-int report JSONs; the board is
  byte-identical to the one they ran on), the trace matrix, every suite, every browser check, the fuzz, `verify:file`, `prove.py`,
  `review:which` (its "UNKNOWN BUILD" for v2.12 is inferred from its source) and the mock-up's 259 rows and planted mistakes.
- **From the lead's transcript only** (header): Brad's "Merge" for PR #30; that this session never wrote or sent the
  hardening list; and that the 28 Oct IT questions and Azure baseline exist, outside git.
- **Not visible from here:** whether an earlier session, or Brad, wrote the hardening list; the repository's security settings and what Brad's GitHub
  plan allows; whether the `orbit-review-mcp` Worker is live and its token valid; whether the evidence package went to OCIO and
  what its `DEPENDENCIES.txt` says; whether CCaR was asked to carry ORBIT's requirement id; any other answer Brad gave outside the
  repository; POA&M, E0, E2 and E3 progress; whether the Azure plan's document 6 and the security team's questions were sent
  (§8 item 40); push access (P1); Codex's state (P7); whether the four `.agents/monitoring/` reviewers in Brad's ChatGPT still
  run (§5).
- **Estimates and gaps:** the sweep hours extrapolate one 22-target pilot chosen for difficulty, and the tag ordering added after
  it was never timed; whether the A6 retargets were proved in a scratch run never committed; the ledger rows (B8), last measured
  19 Oct.
