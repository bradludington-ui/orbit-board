# ORBIT: handoff after v2.24, for v2.25

**Written** 26 Nov 2026 by the v2.19–v2.24 lead (Claude, session `session_01XFu2tzVx9ww4iyoZRT9BsJ`), on branch
`ccr-1b6a4ab3-wntonn`, for the next chat. **Brad's request, 26 Nov:** *"Before go on the next version let's do a handoff and start
a new chat for it."* This file goes into `main` with v2.24 itself, in that version's PR. **It changes nothing in the board.**

**Read it with the tree, not instead of it.** Every figure below was read on the v2.24 tree the gate ran on (`9a558f7`, board
byte-identical to `f5deb5e`) and can be re-read with the commands in §2. If one differs, the tree has moved since this was written:
trust the tree, then find what moved. The previous handoff is `recovery/v213/HANDOFF.md` (after v2.12); none was written for
v2.13–v2.23, so the rules learned in those versions are in `CLAUDE.md`'s version sections, and the decisions in `NEXT-VERSION.md`.

---

## 1. Read this first

1. **Do nothing until Brad says go, and names the scope.** v2.25 is item 157 (the leadership brief and the change bridge), as he
   logged it on 25 Nov. Items 165–171 were logged on 26 Nov from an outside critique and wait for their own go (§4). Ask him which
   of them, if any, join v2.25. Logging or investigating is fine before go; changing the board is not (`CLAUDE.md`, "How changes
   ship").
2. **ORBIT is local and Brad owns all its data** (26 Nov: *"I have no plans to host on SharePoint or azure. I will run locally and
   own all data and information."*). Items 100 and 107 (the Azure build and its IL5 / Zero Trust standards) are withdrawn. Where
   `CLAUDE.md` or a code comment still says "the Azure build will", read "not planned"; item 171 corrects the one place a user sees
   it (Help's PPBE cycles section). Do not propose hosting, a server, sign-in or a network connection.
3. **`main` is v2.24** once its PR merges (`BUILD` = `'v2.24 (26 Nov 2026)'`). Branch from `origin/main`. Your session is given its
   own branch name: use that one, never `ccr-1b6a4ab3-wntonn` (this session's; v2.19–v2.24 were all pushed there).
4. **A new chat is a new container.** Nothing in this container's scratchpad, worktrees or `.math-reports/` reaches you; everything
   that matters is in git. Clone, `git fetch --unshallow` (recon, import and audit-other read old boards out of history: `b2cb041`,
   `c81e995`, `bbb7ee9`, `7ee498a`, `68b02e9`, `ebe702e`, `1589749` and others), then `npm ci`.
5. **`CLAUDE.md` is 470 KB.** It is loaded whole; its first sections (the funding model, how it saves, the left-menu map) and the
   newest version sections (v2.19–v2.24, at the end of the version list) are the ones that bear on new work. Item 165 is to cut it
   down; until Brad says go on that, do not restructure it.
6. **Merge only on Brad's word, with a merge commit, never a squash** (the suites read pinned commits out of history).

## 2. The first 15 minutes: is the tree what this file describes?

```
git log -1 --format='%h %p %s' origin/main        # the merge of the v2.24 PR (two parents), or later
grep -n "^const BUILD=" prioritization-board-grid.html      # const BUILD='v2.24 (26 Nov 2026)';
wc -l -c prioritization-board-grid.html                     # 39647 3038148
npm run check                                               # ends "all checks passed"
python3 -I -B recovery/v200/bin/mcount.py tools/export-audit/mutate.mjs prioritization-board-grid.html
    # {"entries": 3602, "once": 3602, "missing": [], "multiple": [], "unparsed": []}
node tools/money-map.mjs --check   # 245 cells: 97 proven, 148 n/a, 0 open; the report is current
node tools/money-coverage.mjs      # 19/19 surfaces have mutations aimed at them, 0 recorded gap(s)
node tools/math-defects.mjs        # REGISTER HOLDS — 15 known defect(s), 15 guarded by 41 mutation(s)
npm run deadcode                   # 0 unreachable, 0 undeclared, 0 dead rules, 0 unread keys
git status --short                 # empty
```

The registries shrank in v2.19 (the scope-down removed the cost estimate, the Spruills, FYDP Disconnects, the funds flow, the IDS
export, the chart of accounts and the AI review) and again in v2.24 (Budget Year). Fewer surfaces is expected, not a regression.

## 3. Where things stand

| Thing | State |
|---|---|
| Versions this lead shipped | v2.19 scope-down (PR #78), v2.20 copy a cycle's controls (#79), v2.21 APEX look (#80), v2.22 new look and tiles (#81), v2.23 the requirement page, Across the FYDP, Allocate and mandatory on/off (#85, `ea0a273`), v2.24 (this PR). v2.16–v2.18 were also this lead's. |
| v2.24 (items 160–164) | Present in $K; the mandatory box's wording; Execution renamed **Budget Year** with only Spend Plan Forecast and CR Cash Needs, and no CCaR pull taken in (a pull in a file is carried, byte for byte); the two screens restyled; dead code and repeated work removed (`npm run deadcode`, one lane walk per draw). Detail: `NEXT-VERSION.md` › Shipped › v2.24; rules: `CLAUDE.md` › v2.24. |
| v2.24's gate | All 42 `v224-*` mutations proved together on the final tree, 42 of 42 caught by a failed check (`recovery/v224/proved-FINAL.jsonl`). `npm run validate:nightly`: every stage holds but the browser stage, which fails on layout's carried D ×8 alone, as on main (defects 15 / 41; coverage 19/19; money map 245 / 97 / 148 / 0; trace 74 cells; suites 51.4 min, 8 banners + legacy; fuzz seed 942022521; verify-file self-test held). The browser checks the gate does not reach: see the v2.24 notes for the final list. |
| Mutation targets | 3,602, each matching once. Never swept as a set since v1.99 (7 Oct); every version since has proved its own new and retargeted ones against their checks, then together on its final tree. Item 167 is the sweep, on Brad's named go only. |
| Open PRs | None after v2.24 merges. |
| Routines (`list_triggers`, 26 Nov) | **Nightly ORBIT math validation (no sweep)** 07:00 UTC; **Nightly ORBIT data-loss fuzz** 09:00 UTC; **Weekly ORBIT Interface Review** Mondays 08:00 UTC. (A fourth, "Ludington Around Town research", is not ORBIT's: leave it alone.) **Check the nightly validation's runs:** on 26 Nov it fired 07:02 and finished 07:03 UTC, a minute for a run that takes 45–75; it probably ended its turn without watching the gate finish, which its own prompt calls the worst result it can produce. Read that run's session (`cse_01XFu2twjYsi3AYTBn8npuWr`) before trusting a nightly pass, and tell Brad. |

## 4. What is next, and what waits on Brad

**v2.25, as logged (item 157, 25 Nov):**
- *One-page leadership brief* (the Brief view): the bottom line in one sentence, four figures, the money bar, funded against
  requirement by office, the Mission Critical shortfalls; Print / save as PDF and Present full screen.
- *What changed since a locked cycle:* before-and-after tiles, a bridge of why unfunded moved (added, values changed, rank moves,
  removed) whose steps add exactly to the change, and the change list with who and when, from `cycCmpData` and the journal.
- Read first: `CLAUDE.md` "Comparing two cycles" (the rows account for the totals: Σ row deltas = the total delta, per year, per
  column), "Deltas against the reference cycle", and the Mission Critical rules (MC is a memo, measured against discretionary
  alone, `mcCalc()` the one implementation). A bridge whose steps do not add to the change is the defect this board exists to
  prevent; it needs a check that adds them up on a fixture where the reasons disagree.

**Logged 26 Nov, each waiting for its own go** (`NEXT-VERSION.md` › Open):
| Item | What | Touches the board? |
|---|---|---|
| 165 | Cut `CLAUDE.md` to the current rules (~15 pages), history to `HISTORY.md`; `NEXT-VERSION.md` Shipped to `SHIPPED.md`; a list of every rule, kept / merged / history | No |
| 166 | A release check sized to the change: three tiers, and `npm run tier` reading the diff | No (tooling) |
| 167 | One full mutation sweep after v2.24, then new mutations before each money or data release | No; the run needs his named go |
| 168 | *Certify this board* inside the board: `verify-file`'s checks moved into the page, a dated one-page certificate; fits with 157 | Yes |
| 169 | Watch one PMO and one leader use it; an optional usage count kept in this browser only | Yes (the count) |
| 170 | A two-page runbook for a second person, checked by `npm run menus` | Help, possibly |
| 171 | Help stops promising a hosted version (one sentence, two comments) | Wording only |

**Questions for Brad, by number:**
1. **v2.25's scope:** item 157 alone, or with 168 (the certificate fits the brief) and 171 (one sentence)?
2. **Item 165 first?** It changes no code and makes every later session cheaper; it could ship before v2.25 or beside it.
3. **`srcActiveFy`** (open since v2.24): the Spend Plan Source counts a year as active when it is before the budget year *or* a
   carried CCaR pull holds data for it. Keep it, or decide by the year alone? Default: as it is.
4. **The nightly Routine** (§3): whether to rewrite its prompt so it cannot end its turn early, once its 26 Nov session is read.

## 5. Brad's standing rules (all in force)

- **Queue, then build on "go".** Changes are logged in `NEXT-VERSION.md`; nothing in the board changes until he says go. On go:
  build, gate once, bump `BUILD` once (exactly `const BUILD='vN.NN (date)';`), push, move the items to Shipped.
- **Mutation sweeps only on his named go** (20 Oct). `mutate.mjs` is text only during development: build a mutant with
  `recovery/v200/bin/mkmut.py`, count with `mcount.py`, prove with `recovery/v208/bin/prove.py` (all `python3 -I -B`). Never
  `npm run mutate`, never `npm run validate:math`, never `import` mutate.mjs. `npm run validate:nightly` is allowed.
- **Show only what changed** (21 Oct): a diff or the changed lines, never a whole file reprinted; a mutant is its id, find and
  replacement.
- **Never commit a populated board**; `pubState` null and `APPNS` empty (`npm run check` enforces it). Describe data shapes instead.
- **Merge on his word**, a merge commit. Draft PR after the gate. Commit messages end with the attribution lines the session gives
  you; no model id in commits, PRs or code.
- **Every surface follows the board's rules in `CLAUDE.md`**: the funding identities, whole dollars, `apportion()` for any split,
  `tiers()` the only lane authority, every new storage key `prio27`/`spmt` (sealed with `SIDE_SFX` in a PMO copy), every write of
  work through `lsSet`/`lsAll`, every reopen through `reopenPage()`.
- **Plain words to Brad.** He reads on his phone. Lead with what he needs to decide or know; no internal ids in the first lines.

## 6. The method that shipped v2.22–v2.24

1. **Contract** (`recovery/v2NN/contract.md`): the decisions, the seams, each builder's files, the checks each must add, and the
   slots (`// ==== v2.NN Wn: … ====` in each suite and in `mutate.mjs`), written by the lead and committed as the **slot commit**.
2. **Builders in parallel**, each in its own worktree from the slot commit (Agent tool, `isolation: "worktree"`), each writing
   `recovery/v2NN/notes-Wn.md`, a proofs file of its mutations, and a check per change that fails on the commit before it.
3. **Integrate** by hand: merge each branch, fix what the merge shows, run every suite whole on the merged tree.
4. **Review by area**, a skeptic re-running each finding; **fixers** for the confirmed ones, each with its own check and mutations.
5. **Prove every mutation and retarget together on the final tree** (`proofs-FINAL.json` → `proved-FINAL.jsonl`): a later fix
   can put an earlier mutation out of its check's reach, and only the combined run sees it.
6. **Gate:** `validate:nightly`, then the browser checks it does not reach (it stops at layout's carried D ×8): `keys dropdowns
   dialogs leftmenu menus panels pmosave savetarget fileimport pmoyears pointer storagefull standards alloc reqpage across record
   look palette`. Standards must report nothing new.
7. **Notes** (`NEXT-VERSION.md` Shipped entry; `CLAUDE.md` version section with the rules a later change must keep), PR, merge on
   his word.

v2.24 was smaller (one lead, two builders for items 162 / 164 and one for 163); the same steps, fewer agents.

**Commands and limits on this kind of container (4 cores, ~15 GB):**
- `recovery/v223/bin/heavy.sh <cmd>` runs a heavy command under a machine-wide limit of two at a time (6 GB heap unless `HEAP=`).
  audit-board, audit-import and audit-recon need `HEAP=8192`. An exit 137 is the container's OOM killer, never a verdict: rerun.
- `JOBS=2 HEAP=6144 recovery/v223/bin/heavy.sh python3 -I -B recovery/v208/bin/prove.py ids.json out.jsonl` proves a set.
- Stop a run by its pid, **never `pkill -f` on a suite's path** (it kills every agent's run of that suite).
- `node tools/export-delta.mjs --ref <sha>` says which printed figures a change moved (it always exits 0).

## 7. Lessons from v2.19–v2.24 (each in `CLAUDE.md`; the short form)

- **A wording change reaches every suite that quotes the old words**: grep all of them before the gate (met four times in v2.18).
- **Update every check that counts a bar's buttons or a page's tabs in the same commit as the change** (v2.23: four fixers each
  reported the same four failures that were integration's).
- **A block that opens boards frees them** (`bootMark`/`bootRelease`/`settleBoards`); seven that did not ran audit-board out of 8 GB.
- **A check reads an element null-safely**: a mutant caught only because a read threw proves nothing.
- **A figure never carries an inline colour inside a `tr.tot`** (v2.24: gold on navy was 1.00:1 in Harbor since v2.21, and no check
  had opened those screens with figures). A screen no browser check opens with data is unchecked, however green the run.
- **A per-draw cache is emptied when a draw starts and ends and taken again after any save**, with a check that an edit between two
  draws is seen (`tiersDraw`, `flowEntsAZ`).
- **Run `npm run deadcode` after any removal**; it is a call graph, not a name count.
- **Do not add a reader of `EXDB`** (the carried CCaR pull): ORBIT takes no pull in.
- **A new surface that holds money boxes and can redraw by itself goes through `heldRedraw`** (v2.23 A1: Chromium's
  change-on-removal wrote half-typed figures).

## 8. What this file does not know

- Whether the 26 Nov nightly Routine run reported a pass it did not watch (§3); read its session.
- The browser checks' final results on the v2.24 tree were still running when this was written; the v2.24 notes record them.
- Anything Brad holds outside git: real boards, the security team's correspondence, IT's records-management questions.

## 9. A starting message for the new chat (Brad can paste this)

> Read `recovery/v225/HANDOFF.md` on `main`, run its §2 checks, and tell me in a few lines whether the tree matches. Then wait:
> I'll give you the go and the scope for v2.25.
