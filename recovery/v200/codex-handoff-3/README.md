# ORBIT v2.00: handoff 3 to Codex (18 Oct 2026)

**From:** the lead on ORBIT v2.00 (Claude), for Brad to pass to Codex. Written 18 Oct 2026, 5:34 AM ET.
**Purpose:** take independent work off the critical path in small batches. Each batch is sized for one Codex task and
stands alone. Do **one batch at a time**, and each one ends in one report. Brad pastes the report back, and the lead decides
what to adopt. When a batch's report is written, **stop**. Do not go on to the next batch: Brad sends it when he is ready.

## Why these batches

Our side has one machine, and its time is queued behind the release blockers listed under "Not these" below. C2a and C2b
are two save-area fix rounds that we parked for that reason. Both are small, and both are built on fixed snapshots that
need nothing else from us, so Codex can do them while our machine works on the blockers. C1a and C1b look again at what is
already pushed (`16ceb83`), so that any problem there surfaces now, before the final gate, rather than in it. C4a and C4b
prepare one of Brad's decisions (ledger U51), so that he can choose as soon as U10 is on the branch.

## Ground rules (Brad's standing rules; every batch)

Rules 1–8 are the first handoff's, word for word, except where a fact changed. Each change is marked **[changed]** and
explained after the list. Rules 9–11 are new.

1. **Read-only on our branches.** Do not push, commit, open a PR, or edit `claude/v200-fixes-wip`, `claude/v200-ui`, `main`
   or `claude/orbit-v2.00`. Work in your own sandbox. Return everything in the report, as text and unified diffs against
   the stated base. (Brad's rule is one editor at a time; the lead commits.)
2. **`tools/export-audit/mutate.mjs` is TEXT ONLY.** Never import, execute or run it, not even to count. To build a mutant
   board from its text use `recovery/v200/bin/mkmut.py`; to count each entry's find on a board use
   `recovery/v200/bin/mcount.py`. Run both with `python3 -I`.
3. **Never run `playwright install`.** Use Chromium only if your sandbox already has it.
4. **The board file stays the empty template.** Synthetic data exists only at run time. Never return a populated board
   file.
5. **Times are Eastern** and are never later than your clock.
6. **Expected values in tests are hand-written literals.** Every new check must FAIL on the base and PASS on the fix;
   show both runs. **[changed for C2a]**
7. **Bound every run** (for example `timeout 600`), and record the command, **[changed]** the start time (ET), the exit
   code and the time taken.
8. **The can't-fails are data loss and money.** Every exportable product must be exactly right, and every word on screen
   must stay true.
9. **[new] One batch at a time.** Do only the batch Brad sends, and do not widen it. When its report is written, stop.
10. **[new] Do not number ledger rows.** The ledger's highest row is U50. Rows U51–U55 are reserved for U10, which is not
    pushed yet. Give any new finding a provisional id (`C3-1`, `C3-2`, … in the order you find them); the lead assigns the
    numbers.
11. **[new] Not these.** Do not work on any track in flight on our side (one editor at a time): cycreg (U32/U33/U50), U37,
    U40, U44, U18, adoption (U24/U29/U31), U9 (with U43), U9L, U28, and U10, whose twelve commits are staged and under the
    lead's check. U19 and U19H are held on our side while you have C2a and C2b.

**What changed, and why:**
- **Rule 6, for C2a only.** In C2a the board is already right, and the new checks guard a line it gets right. They are
  CONTROLS: they must PASS on the base and on the snapshot, and FAIL on the mutant board each new mutation entry makes. Show
  those runs in place of "fails on the base, passes on the fix". Every other batch keeps rule 6 as written.
- **Rule 7.** The start time (ET) is now asked for too.
- **`AGENTS.md`** in the repository says to run the sweep through `npm run mutate` or `validate:math`. For these batches,
  rule 2 wins: run neither.

## Where things are

- **Repository** `bradludington-ui/orbit-board`, branch `claude/v200-fixes-wip`. This package is committed there as a
  records commit on top of `16ceb83`. That commit's product (the board, `tools/`, `package.json`) is `16ceb83`'s.
- **Fixes committed and pushed since the first handoff.** Each passed two independent reviews and the lead's commit check:

  | ledger row | commit | what it does |
  |---|---|---|
  | U20 | `ef1548c` | a save (or Load theirs) waiting for another tab's save is under way from the moment it is asked for |
  | U30 | `d701888` | a refresh takes the folder's copy as the base only when it is on screen; the words with nothing recorded |
  | U34 | `b9e9837` | a saved year selection the board did not write is read as no year, kept and said, never as ALL YEARS |
  | U36 | `8b39373` | an RCN / EEIC title over 80 characters is refused, never cut |
  | U41 | `867fd4a` | an SI code a file carried is kept as saved and listed; its money is under no recognized code |
  | U42 | `1a6a66e` | a funds-flow sheet name never splits a character or keeps an apostrophe at either end |
  | U3 | `e219a68` | a Save asked for during the mixed-import hold is refused at once, never queued |
  | U4 | `16ceb83` | the folder save checks the mixed-import hold after its read and before its write |

  Earlier, before the first handoff (all in its base `7ee498a`): U1 `0b4144a`, U14 `d66dd60`, U13 `63bd8b0`, U2
  `4e90af4`/`a8891e1`, R1–R5, and Correction A.
- **Base for each batch.**
  - C2a and C2b: `7ee498a46507972f803cd48ce9f27d5d668acb63` plus the snapshot's diffs. Their product is `d66dd60` and
    their base board blob is `fce8a391`.
  - C1a and C1b: `16ceb83`.
  - C4a and C4b: the commit the lead names when U10 is pushed.
- **Findings:** `recovery/v200/UNRESOLVED-LEDGER.md`.
- **Inputs:** `recovery/v200/codex-handoff-3/inputs/`.
  - `u19/` is for C2a, and `u19h/` is for C2b. Read each folder's `SNAPSHOT.txt` first: it gives the base, the diffs, the
    blobs, what the copy does, and every file in the folder. `MANIFEST.sha256` gives each file's sha256.
  - `tools/mkfocused.py` builds a focused harness (see "Small runs" below).
  - C1a, C1b, C4a and C4b need nothing beyond the branch.
  - Paths inside the reviewers' texts are from our machine. Treat them as references.
- **Suite-block style** for any proposed tests: follow the existing v2.00 blocks exactly.
  - Use the async wrapper and `bootMark()`/`bootRelease(__bm, keepBoards())`/`settleBoards()`.
  - Include the two-space `  const name = '...';` line. The suite's closing guard reads that line to check that every
    block ran.
  - Use the `// ==== <name>` and `// ==== end <name> ====` markers.
- **Mutation entries** for proposals are `{ id, area, what, find, repl }`. Insert them into the mutate.mjs TEXT before
  the line `  // v2.00 (R3, Brad 11 Oct): a save that lands under a locked view says it saved the working plan.`.
  - Each find must match its board exactly once.
  - Every existing entry must still match exactly once (check with mcount.py).
- **Small runs.** On our machine we run one audit-import block at a time, not the whole suite. To do the same, build a
  focused harness from the suite.
  - `python3 -I inputs/tools/mkfocused.py <suite> <out.mjs> '<first marker line>' '<end marker line>'`
  - It copies the following from the suite, verbatim: its imports, the failure list, the check helper, the one block,
    every top-level helper that block uses (followed transitively), and the closing guard.
  - Put the output in `tools/export-audit/`, because it imports `./boot.mjs`, and run it with node from the repository
    root. `BOARD=<file>` runs it on another board, such as a mutant. `SUITE_CHECKS=<file>` records every check, its
    verdict and what was read.
  - Delete the harness before you make your diffs.
  - It works on audit-import's shape only. audit-recon ends differently, and the tool refuses it; audit-recon runs whole
    in about 4 minutes anyway.
  - The full audit-import needs a real git repository for its v1.86 block. A focused harness does not.
  - On our machine, some focused runs load a 12-line shim first that gives each jsdom window node's
    `TextEncoder`/`TextDecoder`. If you see "TextEncoder is not defined", do the same and say so. Our copies carry it, but it
    is not in the repository.

## Batches (one at a time; stop and report after each)

| ID | Size | What to do | Inputs | Starts |
|---|---|---|---|---|
| **C2a** | small | **U19 fix round 3: the one test must-fix.** Add one CONTROL scenario and up to two mutation entries to the U19 block. Tests only; the board is right. | `inputs/u19/` | **now** (the only batch sent now) |
| **C2b** | small | **U19H fix round 1: the two money must-fixes** (false words with a two-appropriation file; a false instruction when storage refuses a list the folder does not carry). | `inputs/u19h/` | after Brad has pasted C2a's report back |
| **C1a** | medium (runs only) | **Full-gate runs on `16ceb83`**, without `validate:math`. Report only. | none | optional, later, on Brad's go |
| **C1b** | medium (reading) | **Adversarial review of U34 (`b9e9837`) and U41 (`867fd4a`)**, the two pushed fixes that move money. Report only. | none | optional, later, on Brad's go |
| **C4a** | small | **U51, option 1 (words only):** prototype, test, and say what it changes for a person using the board. | none | **not yet: starts when U10 is on the branch** |
| **C4b** | small | **U51, option 2 (behaviour):** the same for the other option. | none | **not yet: starts when U10 is on the branch** |

### C2a: U19 fix round 3, the one test must-fix (small; start now)

**Snapshot:** `u19-fr2`, which is U19's copy after fix round 2 (13 Oct, 1:38 PM ET). It is `7ee498a` plus
`inputs/u19/board.diff`, `audit-import.diff` and `mutate.TEXT.diff`. Its blobs are board `7a6e29cb`, audit-import
`424cd9ae` and mutate `07b53964`.

**The gap** (the test reviewer's MF-1, verbatim in `inputs/u19/REVIEW-tests-r3-MF1.txt`):
- With U19, every ↶ Put back of saved work in the board file writes what is on screen into the kept slot before the load.
- If the load then refuses (the kept copy was built for another service list), only this one line writes the kept work K
  back: `if(swapped){ try{ localStorage.setItem(_AP.key+'.kept', JSON.stringify(k.meta)+'\n'+k.raw); }catch(e){} }`.
- No check covers that line. Two wrong forms pass all 136 checks: deleting it, and narrowing it to
  `if(swapped && nowUnsaved){`. With either one, K is then in no copy the board can reach, also after a reopen.
- The money reviewer found the same gap and rated it should-fix (SF-1). Closing MF-1 closes it too.

**Do this:**
1. Apply the snapshot (see `SNAPSHOT.txt`) and check the three blobs.
2. Add a scenario (z) to the U19 block, after (y). Use the block's own helpers and voice, and label it a CONTROL. Start
   from `proposal/money-r3-scenario-z.txt` or `proposal/tests-r3-scenario-z-reach.txt`, or combine them. The wider form
   also checks that K's text is in this browser's storage after the refusal and after a reopen. Say which you chose and why.
3. Add the entries `v200-u19-putback-refused-no-restore` (`proposal/money-r3-entry.txt`) and
   `v200-u19-putback-restore-unsaved-only` (the third entry in `proposal/tests-r3-entries.txt`; that file's first two
   entries are not C2a's). Put them after `v200-u19-putback-locked-asks` and before the R3 line.
4. Run mcount on your mutate text against the snapshot's board. Every entry must match exactly once: 1353 of 1353 if you
   add both entries.
5. Do these runs, each bounded and logged:
   - your new checks on the snapshot's board: they pass;
   - your new checks on the base board (`7ee498a`'s): they pass (a control, rule 6 as changed);
   - your new checks on each new entry's mutant board (made with `mkmut.py`): at least one fails. Quote what it got;
   - the whole U19 block, once, on your final copy: 136 plus your new checks, all passing.
   The quickest way to run (z) alone is `proposal/money-r3-zblock.mjs.txt`, which holds the block's head and helpers plus
   (z) only. Insert it into a scratch copy of the suite right after `// ==== end v2.00 (U19) ====` and build the harness
   from its own two marker lines. The whole block peaks at about 2.75–2.9 GB and takes about 3 minutes on our machine. If
   your sandbox cannot hold that, say so and stop at the (z) runs; the lead then runs the whole block here. Do not run the
   full audit-import: that is the lead's.

**Not in C2a:** any board change; the money reviewer's SF-2 (the drafts' words); the test reviewer's SF-1 (the `scrWhere`
words, its scenario (aa) and two entries) and SF-2 (memory); NEXT-VERSION.md.

**Overlap, for your information only.** U19's area overlaps U20 and U30, which are already committed. Our integration
note 5 says: "keep U19's 'swap' branch first, then c2f's 'after' wording". The lead lays U19 onto the current tip. You work
on the snapshot as it is.

**Return:**
- `audit-import.diff` and `mutate.TEXT.diff` against the snapshot `u19-fr2`, not against `7ee498a`;
- the run log (rule 7) with the runs above;
- the mcount result;
- a short note saying how MF-1 is closed: which wrong forms of the line are now caught, and by which checks;
- if you like, text for the drafts' counts (checks, controls, mutations). Do not edit NEXT-VERSION.md.

### C2b: U19H fix round 1, the two money must-fixes (small; after C2a's report is back)

**Snapshot:** `u19h-c1`, which is U19H's copy as built (13 Oct, 9:17 PM ET). It is built on U19's `u19-fr2`, not on
whatever C2a returns. It is `7ee498a` plus `inputs/u19h/board.diff`, `audit-import.diff` and `mutate.TEXT.diff` (or `u19-fr2` plus
`u19h-only-on-u19.diff`). Its blobs are board `dbfd5f85`, audit-import `120d9f14` and mutate `c91510c8`.

**The two must-fixes** (verbatim in `inputs/u19h/REVIEW-money-r1.txt`; the review's verdict was UNSOUND):
- **M1 (false words).** Take a board file holding two appropriations, where the other one was saved later. Put back K,
  then put back N. N is exactly the board file's own saved copy of this appropriation, yet the top bar says "Unsaved
  restored work — not written to the board file". The cause: `putBackUnsaved` compares `MS.ts` with the record's file time,
  which is the newest appropriation's time in the file, not this appropriation's.
- **M2 (a false instruction).** Working in the shared folder, browser storage refuses a list that the folder's copy does
  not carry (for example the reprogramming log). The tooltip then says "until 💾 Save writes it, it is on this page only",
  and it still says so after a Save that landed. A folder Save never writes that list.

The reviewer's tested minimal fix is `reviewer/money-r1-cfix.diff`, and its probe is `reviewer/money-r1-vprobe-block.mjs.txt`.
The fix also holds should-fix V3's `_dlOnly=false`. Say whether you keep that line; it is not required in C2b.

**Do this:**
1. Apply the snapshot and check the three blobs.
2. Fix M1 and M2 in U19H's own lines, as small as the review's fix or smaller. If you differ from it, say why.
3. Add checks to the U19H block in its style, with literal clocks and sentinel notes as the block uses them:
   - a two-appropriation scenario for M1;
   - a folder side-list refusal check for M2, read before and after a Save that lands.
   Each check must FAIL on the snapshot and PASS on your fix.
4. Add one mutation entry per must-fix: one that drops M1's new clause, and one that drops M2's folder case. Each must be
   caught by your checks.
5. Run mcount on every entry.
6. Run the whole U19H block (focused, about 90 s on our machine) on the snapshot and on your fix, and each new entry's
   mutant on your fix.

**Not in C2b:** the should-fix and minor items (they are context only); U19's own block; any other track.

**The tests review.** U19H's round-1 test-adequacy review never ran, and it is **not usable**. The reviewer found our stop
flag set and returned an empty placeholder after about 5 seconds; `inputs/u19h/SNAPSHOT.txt` gives the details. **Our side
redoes it** on the copy that comes out of C2b. It is not Codex's job, and C2b does not wait for it. Until it is redone, no
one has checked whether the U19H block's tests are adequate.

**Overlap, for your information only.** U3 and U4 (the mixed-import hold) are now committed. The U19H builder found that
one committed U4 check reads the tooltip's first sentence ("Saved Jan 5 … by brad", `/Jan/.test(tip(…))` in audit-import)
while the board is unsaved. U19H removes exactly those words. The lead resolves that at integration; you work on the
snapshot.

**Return:**
- `board.diff`, `audit-import.diff` and `mutate.TEXT.diff` against the snapshot `u19h-c1`;
- the run log (rule 7), with the new checks failing on the snapshot and passing on the fix;
- the mcount result;
- one short note per must-fix saying how it is closed;
- if you like, replacement text for the sentences of `NEXT-VERSION-U19H.md` that your fix makes untrue. Do not edit
  NEXT-VERSION.md.

### C1a: full-gate runs on `16ceb83` (optional, later; runs only, report only)

Clone the branch and check out `16ceb83` (a real git clone: audit-import needs one). Install the dependencies with npm.
`playwright-core` downloads no browser; never run `playwright install`. Then run the following **one at a time**, with
nothing else running beside audit:import or audit:board. Bound and log each (rule 7).

| # | command | cap | its last line on a pass | about, on our machine (13 Oct, an earlier tip) |
|---|---|---|---|---|
| 1 | `npm run check` | 600 s | `all checks passed` | under 1 min |
| 2 | `node tools/export-audit/boot-same.mjs` | 600 s | `every page, source, save and error list is identical either way` | under 1 min |
| 3 | `npm run audit:export` | 600 s | `ALL CHECKS PASSED` | under 1 min |
| 4 | `npm run audit:ppt` | 600 s | `ALL CHECKS PASSED` | under 1 min |
| 5 | `npm run audit:other` | 600 s | `ALL CHECKS PASSED` | about 1 min |
| 6 | `npm run audit:board` (alone) | 900 s | `ALL CHECKS PASSED` | about 3 min |
| 7 | `npm run audit:import` (alone) | 1800 s | `ALL CHECKS PASSED` | about 9 min or more (our cap is 900 s + 20 s; give a slower sandbox room, and say if it times out) |
| 8 | `npm run audit:recon` | 900 s | `ALL CHECKS PASSED` | about 4 min |
| 9 | `npm run audit:legacy` | 600 s | `  every legacy Force setting computes exactly as before` | under 1 min |
| 10 | `npm run audit:hostile` | 600 s | `ALL CHECKS PASSED` | about 1 min |
| 11 | `npm run audit:inject` | 600 s | `ALL CHECKS PASSED`, with a line of 96 `=` before it | under 1 min |
| 12 | `npm run fuzz -- --rounds 12` | 1200 s | `seed <N>`, after `NOTHING WAS LOST — 12 randomized board(s) survived every round trip intact` | not measured at 12 rounds |

- Runs 2 to 11 are every suite that `package.json`'s `audit:*` scripts run (`audit:suites` chains them, starting with
  boot-same). Run them one by one, not through `npm run audit`.
- **Not in C1a:** `npm run validate:math` (it runs the mutation sweep, which runs mutate.mjs, and takes hours);
  `npm run mutate` (never); the Chromium tools (`verify:grid` and the rest). Ledger U28 records that verify:grid fails in
  our container at every commit tested, from a font substitution; it is not part of this batch.
- **Return:** a table of the runs (command | start ET | exit | time taken | its last line, quoted | counts). Quote the
  fuzz SEED. For any failing check, quote its first 40 lines of output verbatim. Then list any "nothing found" items worth
  stating. Fix nothing.

### C1b: adversarial review of U34 and U41 (optional, later; reading and probes, report only)

**Why these two:** they are the two pushed fixes that change which dollars are counted, and under which line they are
filed, on screen and in the exported workbook.
- U34 (`b9e9837`) decides whether a saved year selection counts every year or none. On its fixture, a malformed
  selection read as ALL YEARS counted $540M; it is now read as no year, kept and said.
- U41 (`867fd4a`) moves a requirement's money from a derived SI code's row to "— no recognized code —". On its fixture
  that is R1's $1,100,000, which was under LA.

The other six are covered differently. U20, U30, U3 and U4 change save paths; our data-loss lens covered those in two
reviews and the commit checks. U36 and U42 change text and sheet names.

**Do this:**
1. Read ledger rows U34 and U41 and their NEXT-VERSION.md entries at `16ceb83`. Read the product diffs:
   `git show b9e9837 -- prioritization-board-grid.html tools/export-audit/audit-recon.mjs` and the same for `867fd4a`.
2. Attack them for three things:
   - wrong money in any export or on screen: the panel, the scope label and notice, the workbook's NOTE, the SI matrix,
     the overview, the CR cash return's line, Needs attention and Pre-flight;
   - data loss: a value the file carried that is gone after a save and a reopen;
   - words on screen that are not true.
3. Write your own probes with synthetic data made at run time. The U34 and U41 blocks are in audit-recon; run audit-recon
   whole (about 4 minutes).

**Return:** for each finding:
- the commit;
- the surface;
- the exact reproduction (a script, or steps);
- expected vs got, with literal values;
- the severity: data loss, money or words;
- proposed ledger row text, with a provisional id (`C3-1`, …).

Then list the "nothing found" items worth stating: what you tried that held. Fix nothing.

### C4a and C4b: ledger U51, the money reviewer's two options (NOT YET: start when U10 is on the branch)

**Not yet.** These start only after the lead pushes U10, and only on Brad's go. The lead will name the commit. Until then,
ignore them.

**The question (ledger row U51, added with U10):** "Edits a locked view allows are kept, while its banner says 'Read only:
nothing changed here is kept'". One part of it was measured by U10's money review (round 6, probe P1b):
- a Connect pressed while a locked cycle (PB27) is on screen still takes the shared folder's cost estimates, execution
  data and reprogramming log;
- it does so right after the status line says "🔒 Loading from the shared folder is off while PB27 is on screen … the
  change was not kept";
- a colleague's 2028ACE taken that way moves the ACE tie-out exported from PB27's view from $900 to $4,321 for Req A.

The reviewer gave two board options. They are quoted here verbatim; `U<n>` is U51:

> ## (d) Board options (not built; Brad's decision under U<n>)
>
> 1. Words only: name the plan's copy in the refusal (`cycRefuse('Loading '+lbl+' from the shared folder')`), so the line says
>    what was refused; the list pulls stay as they are. Changes the expected value at
>    `tools/export-audit/audit-recon.mjs:5912` (OFF('Loading from the shared folder')) and the finds of
>    `v200-u10-folder-pull-*` entries (mutate.mjs.txt:4413, 4416, 4435) — principle 6: list them.
> 2. Behaviour: in `driveConnectNow` (and `driveAutoConnect`), skip the three list pulls while `CYCVIEW` is set. A colleague's
>    cost estimate then arrives at the next Connect or opening, not on the Live tick.

The line numbers are from U10's track copy. On the branch, find them by their text: `OFF('Loading from the shared
folder')` and the entries `v200-u10-folder-pull-*`. These options cover the Connect's pulls only. The rest of U51 (a CCaR
QPE import, a reprogramming row, unlocking or deleting a cycle from the view) stays in Brad's wider question in row U51.
C4 does not decide that.

- **C4a: option 1, words only.** **C4b: option 2, behaviour.** Each is its own batch with its own report. The lead sets the
  two side by side for Brad.
- **Do this (each):**
  1. Prototype the option as a diff against the commit the lead names.
  2. Add a test block in the v2.00 style (with checks that fail on that commit and pass on the option) and mutation
     entries.
  3. List every existing expectation and mutation find the option changes, old → new, with file:line and why.
  4. Run the U10 blocks and the suites the option touches, and mcount on every entry.
- **Return (each):** the diff, the run log, the mcount result, and a paragraph of up to 10 lines titled **"For a person
  using the board"**. It says, with literal values, what changes for them:
  - what the status line says after a Connect in PB27's view;
  - what goes into the board and browser storage;
  - what the export from the view shows (for example, Req A's ACE tie-out: $900 or $4,321);
  - when a colleague's data arrives.

## Report format (one per batch)

```
BATCH <id>  |  commit <sha> (and snapshot <name> if used)  |  started / finished <times ET>
FINDINGS: what you reproduced, the exact steps, and observed vs expected (literals)
PROPOSAL: unified diff against the stated base or snapshot (board / suite / mutate.mjs TEXT), each change explained in one line
RUNS: command | start ET | exit | time taken | result (counts); the runs rule 6 asks for; mcount result
NOT DONE / LIMITS: anything not run or not covered, said plainly
QUESTIONS FOR BRAD: only if a decision is genuinely his
```

C1a's report is its table of runs, then any failures, then the "nothing found" items. C1b's report is its findings, then
the "nothing found" items. Leave PROPOSAL empty in both.

## What happens to the report

Brad pastes it back here, and the lead checks every claim before adopting anything:
- each run is repeated, or its log is read;
- each reproduction is re-run;
- each literal is recomputed.

Adopted fixes are applied to a scratch copy and go through our usual path:
- two independent reviews (a data-loss and money lens, and a test-adequacy lens);
- fix rounds if the reviews find anything;
- the lead's own commit check, and the lead's own commit.

New findings go into the ledger under the numbers the lead assigns, credited to Codex. Nothing you send is committed as
is. If a snapshot or a base changes, the lead publishes a new folder and names the batches it affects. Please state, in
each report, the commit and the snapshot you used.
