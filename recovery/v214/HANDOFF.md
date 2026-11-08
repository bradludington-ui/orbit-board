# ORBIT: handoff after v2.14, for v2.15

**Written** Sun 8 Nov 2026, about 9:40 AM Eastern (14:40 UTC), by the v2.13–v2.14 lead (Claude, session
`session_01XFu2tyiQyPVZM6k2bmmxjc`, branch `ccr-26126337-csqb5v`), at `main` `8413a7b`, for whoever picks up next: a new
Claude session, Codex, or Brad. **It changes nothing in the board.** Brad asked for it on 8 Nov ("Provide a handoff") right
after merging v2.14. Times are Eastern unless marked UTC.

The handoff before this one is `recovery/v213/HANDOFF.md` (written after v2.12). Its §8 holds 40 decisions; Brad answered all
of them on 3 Nov with *"Accept all recommendations"*, so that file's recommendations are now his decisions. This file says
what changed since then and what is still open.

---

## 1. Read this first

1. **v2.14 is on `main`.** `8413a7b` merged PR #34 with a merge commit on Brad's "Merge" (8 Nov 2026). Its parents are
   `c863dc2` and `dc8718d`. `BUILD` is `'v2.14 (8 Nov 2026)'`. The board file is byte-identical to `7c260e5`, the tree the
   final gate ran on; the commits after `7c260e5` touch only notes and proof records.
2. **The branch `ccr-26126337-csqb5v` sits at `main`** (`8413a7b`, pushed). It carried v2.13 and v2.14. Its PR (#34) is
   merged, so new work on it needs a **new** PR. Check a PR with `pull_request_read get` (`merged`), never `list_pull_requests`
   (it shows `merged:false` for every PR).
3. **Merge with a merge commit, never a squash.** The suites read pinned commits from history: `1589749`, `68b02e9`, `77882d9`,
   `7ee498a`, `84dcaf9`, `b2cb041`, `bbb7ee9`, `c81e995`, `c863dc2`, `ebe702e`, `f76e327`, `fe0c83d`. All are ancestors of
   `main`. A shallow clone fails those checks: `git fetch --unshallow` first.
4. **One question is open with Brad (§3, Q1):** run the mutation sweep's first batch on v2.14 before building v2.15, or after.
   The sweep itself is authorized (decision 27, and v2.14's answer 5). Do not start either until he answers.
5. **Read `CLAUDE.md`'s v2.14 section** ("v2.14 (items 140, 141, 129, 124; …)", just before "## Colour"). Its "What it leaves for
   the next change" list holds the rules v2.15 must keep: who may write another appropriation, `SIDE_SFX` on new keys, every
   deliberate reopen through `reopenPage()`, Save's put-back only while this page wrote last, and so on.

## 2. Is the tree what this file describes? (measured 8 Nov, 14:30 UTC, on `8413a7b`)

```
git log -1 --format='%h %p' origin/main          # 8413a7b c863dc2 dc8718d
grep -n "^const BUILD=" prioritization-board-grid.html   # 3624:const BUILD='v2.14 (8 Nov 2026)';
wc -l -c prioritization-board-grid.html          # 42797 3172920
npm run check                                    # exit 0, "all checks passed"
python3 -I -B recovery/v200/bin/mcount.py tools/export-audit/mutate.mjs prioritization-board-grid.html
    # {"entries": 3607, "once": 3607, "missing": [], "multiple": [], "unparsed": []}
node tools/money-map.mjs --check   # 322 cells: 119 proven, 202 n/a, 1 open; the report is current
node tools/money-coverage.mjs      # 27/27 surfaces, 0 recorded gaps
node tools/math-defects.mjs        # REGISTER HOLDS — 20 known defect(s), 20 guarded by 55 mutation(s)
git status --short                 # empty
```

The one open money-map cell is v2.04's (`aiExport` × Fiscal year). If any figure differs, this file no longer describes the tree.

## 3. Waiting on Brad

| # | What | State / recommendation |
|---|---|---|
| Q1 | **Sweep first, or v2.15 first?** The sweep runs on a committed tree that does not change, with nothing else running, so it cannot overlap a build. | Asked 8 Nov, unanswered. **Recommended: sweep first.** It tests the code he is about to go live with. |
| Q2 | **His Windows check of v2.14.** The kit went to him before the merge; he merged without reporting a result. | Record the result in `NEXT-VERSION.md` › v2.14 › "Brad's answers", answer 2, when it comes. Anything it finds is a v2.15 fix. The kit is rebuilt with `node tools/windows-check-boards.mjs --out <dir>` (made-up boards only; written outside the repo). |
| Q3 | **Moving his live board to v2.14.** His live version is v2.12, and his "ORBIT Live.html" is too big for browser storage (item 141). The path is v2.14's full import → *Write the imported board into a new file…*. | Nothing to build. If he reports trouble, ask for the message text and the version in the header, never the file. |
| Q4 | **A release tag.** Decision 24 (tag `fe0c83d` as v2.12) was accepted, but **the remote has no tags** (`git ls-remote --tags origin` is empty). | Tag `fe0c83d` as `v2.12` and `8413a7b` as `v2.14` (and `bc5d2a2`, v2.13's merge, if wanted) on his word. If the API refuses tag creation, say so; it may need his own push. |
| Q5 | **The disabled "v2.00 overnight check-in (hourly)" Routine** (`trig_01PhhHK97YTPeEsCZr3X2fvw`). Decision 29 (delete it) was accepted, but it still exists. | Delete it with `delete_trigger`; if refused, tell him. |
| Q6 | Things only he can do, from the v2.13 handoff: revoke `orbit-review-mcp`'s credentials (item 35 there); the security team's questions; E0 (are the interim pilot restrictions in effect); the evidence package stays at `f616daa`; the Routines' attached repository is still the old `spmt-…` URL (only the Routine editor changes it). | Unchanged since 3 Nov. |
| Q7 | Clean-up: 16 worktrees under `/home/user/orbit-wt/v214-*`, each at a commit already in `main`, each with a clean status (checked 8 Nov). The 24 remote branches besides `main` (§7). | Remove the worktrees freely (container-local). Deleting remote branches is his call. |

## 4. The next work

**v2.15** (Brad's go of 3 Nov; `NEXT-VERSION.md` › Open). Items 137–139 and the small fixes, plus 142–146, which were found
while building v2.14:

| Item | What | Where |
|---|---|---|
| 137 | The context bar never wraps (the PPBE figure pushes it to two lines below ~1,138 px). | `NEXT-VERSION.md` heading "#### 137." |
| 138 | A package keeps the receiving board's PPBE cycle (Brad: "only import the cycle being identified"). | "#### 138." |
| 139 | Retag moves every appropriation that has locked the cycle ("2a"). | "#### 139." |
| small fixes | Item 131's strict folder read (five-year plan) and the Spruills and Locks by appropriation; item 135's four gaps; v2.12's question 1 (a CLIN request that is not a list, reported on opening); the guide's five-year text; the Priority Drill's narrow columns; the five-year workbook's "Allocated" renamed Funded. | The go note at the top of Open; items 131, 135 |
| 142 | A newer board file opened over another board's older copy shows that copy's requirement list (DATA is storage-first). **Data-loss class: build it first.** | "#### 142." |
| 143 | 💾 Save records every appropriation it wrote (the false HOLD ON after an import). | "#### 143." |
| 144 | The other direct storage writes go through `lsSet` (D17). | "#### 144." |
| 145 | Two tabs of one browser on one appropriation. | "#### 145." |
| 146 | About 40 small findings from building and reviewing v2.14, each with its evidence. Triage them: build the ones that lose or misstate something, log the rest. | "#### 146." |

The guide is near its budget: audit-import holds it under 70,000 characters as the browser draws it. Any guide text v2.15 adds
must trim elsewhere or raise the budget on purpose, measured in a booted board.

**v2.16:** item 133, the Service share workbook (mock-up in `recovery/item133-mockup/`). Writing the contract number to the
Spend Plan Source waits until CCaR names its column.

**Later / parked:** items 100 and 107 (Azure; until hosting is chosen), 106, and E1 (Brad: "Not needed this week").

Before building, write v2.15's entry in `WORK-ASSIGNMENTS.md` (the v2.14 entry is closed by the commit carrying this file).

## 5. How v2.14 was built (it worked; reuse it)

1. **A map, then a contract.** `recovery/v214/map.md` (the code each item touches, at the base commit) and `contract.md`
   (each workstream's scope, the decisions, the checks it owes, and the questions with recommended answers that Brad took).
2. **A slot commit** (`ea412ca`): the seams two workstreams shared, inert, plus a named slot per workstream in each suite and in
   `mutate.mjs` (`// ==== v2.14 Wn … ====`). Merges then did not collide.
3. **Workstreams in their own worktrees**, at most two heavy ones at a time on this 4-core, 15 GB container. Each
   reproduces its defects on the base first, builds, writes checks that fail on the base, writes mutations, and proves each one
   with `JOBS=1 HEAP=8192 python3 -I -B recovery/v208/bin/prove.py IDS.json OUT.jsonl` (resumable).
4. **Integration by the lead**: merge one workstream at a time, run `npm run check` and `mcount` after each, then write
   integration checks (INT-1…INT-11) for what only shows once the pieces meet.
5. **Two review rounds**, by area, each finding re-run by two skeptics trying to refute it, plus a critic asking what is
   missing. Fixers reproduce, fix, check and prove; an independent agent checks each fix and its findings go back to the fixer.
6. **The final gate on the merged tree:** every suite whole (round 2 found an expectation that only broke once two fixes met),
   every v2.14 mutation proved together (`proved-FINAL.jsonl`, 421 of 421), the browser checks, and `validate:nightly`.

Each workstream's own record is `recovery/v214/notes-*.md`; the Shipped entry in `NEXT-VERSION.md` summarizes all of it.

## 6. Working rules learned the hard way (environment)

- **Heaps.** audit-board, audit-import and audit-recon need `NODE_OPTIONS="$NODE_OPTIONS --max-old-space-size=8192"` (append:
  `NODE_OPTIONS` already holds `--use-openssl-ca`). Run them one at a time. Four heavy runs at once on this box got exit 137 (the
  kernel) more than a dozen times. **An exit 137 is the container, never a verdict.**
- **Python** as `python3 -I -B`. Never `import` `mutate.mjs`; never run `npm run mutate` or `validate:math` without Brad's named go.
- **Two proof runs never share a tree** (prove.py's suite copies are removed when it stops).
- **Browser checks seed storage from page code**, never from an init script; never `playwright install`.
- **Workflows and long agents die with a container restart.** Agents that commit as they go survive; anything only in the
  scratchpad does not. A weekly usage limit also stopped three fixers mid-run; after the reset, two had committed
  and one was finished by hand. Check each worktree's `git log` before assuming lost work.
- **`verify:grid` stops at layout's carried D ×8**, so run `keys`, `dropdowns`, `dialogs`, `leftmenu`, `pmosave`, `pmoyears`,
  `pointer`, `savetarget`, `fileimport`, `storagefull` and `standards` yourself after a change that moves a menu, a box or Save.

## 7. Repository and Routines (8 Nov)

- **Remote branches:** 25 heads (`main` plus 24). `ccr-26126337-csqb5v` = `main`. The others are older session branches,
  `claude/orbit-v1.91`…`v2.00`, `claude/security-review-kit` (kept as the record of what the security team was given),
  `claude/v200-fixes-wip`, and three `codex/*`. **No tags.**
- **Routines:**
  - The nightly math validation (07:00 UTC, no sweep; prompt updated 3 Nov) and the nightly data-loss fuzz (09:00 UTC) both
    fired today on `main` as it stood before the merge. Their first run on v2.14 is 9 Nov.
  - The weekly Interface Review runs Mondays 08:00 UTC; next is 9 Nov.
  - Read a run's result from its session with `list_events(<session_id>, kinds:["result"])`. A `SUCCEEDED` `last_run` means
    only that the wake was delivered.
  - The two "Ludington" Routines are Brad's family ones: leave them alone.
  - The disabled v2.00 check-in is Q5.
- **Expected on the first v2.14 nightly:** every stage holds but layout's carried D ×8; defects 20 / 55; coverage 27/27; money
  map 322 / 119 / 202 / 1. Any other figure is a change.

## 8. Not checked for this file

- The 8 Nov Routine results were not read (they ran on v2.13's tree, before the merge).
- No suite, browser check or fuzz was re-run on `8413a7b` itself; it is byte-identical to the gated tree (§1), and §2's five
  commands were run on it.
- Codex's state, and whether the four `.agents/monitoring/` reviewers still run in Brad's ChatGPT, are unknown.
