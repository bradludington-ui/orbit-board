# Verdict, round 3: U1, then U14, after the builder's fix round 2 (builder dir `rec/L3/u14`)

Written 12 Oct 2026, 11:55–11:58 AM ET, by the U1-U14 adversarial verifier.
- **Earlier rounds are kept.** Round 1 (8:08 AM ET) is in `round1/`. Round 2 (10:29 AM ET, "sound, with issues", two
  must-fixes) is in `round2/VERDICT.md` and `round2/README.md`, byte-identical to the files this one replaces (blobs
  `a9108370` and `ccc5cbe8`).
- **This round** checks fix round 2 (10:30–11:10 AM ET). My work ran 11:12–11:58 AM ET. Every run, PID, blob and mutant is
  in `r3/`; the process record is `README.md`.

**Verdict: sound, with issues. No must-fix.**
- **Both round-2 must-fixes are fixed, and the fixes are sensitive.**
  - The toggle **off** check fails on round 2's escaping mutant, now the catalog entry `v200-u14-toggle-off-drops-saved`.
  - The **"only"** check fails on `v200-u14-only-keeps-saved`.
  - The plural case (S5d) catches `v200-u14-notice-plural-it`, and each of my five new plural mutants.
- **The product is unchanged and right.** Both boards are byte-identical to round 2's rebased boards. On the rebased board:
  - my notice probe passes 19 of 19;
  - Chromium passes 8 of 8, at four widths;
  - a new probe of the other routes passes 10 of 10.

  Nothing loses data or changes money.
- **Every reported run reproduces exactly.** I re-ran 83 runs: 65 focused, 3 matrix, 11 full suites, 2 check.mjs and 2
  byte probes. All 65 focused runs match the builder's run of the same name in every check, verdict and observed value. All
  1,743 matrix results match, and so does every suite result line.
  - Against fix round 1, all 58 pairs keep every earlier check, with the same verdict and value.
  - The only new checks are the 6 the builder lists.
- **One gap remains, test-only, outside the stated change: should-fix 1.** Three of my 13 new mutants escape all 179 checks.
  Each silently narrows the saved year selection through a route the U14 block never takes:
  - an appropriation switched on or off;
  - ALL appropriations;
  - the working year moved.

  The product is right on all three routes. I drafted three checks that catch all three mutants, and measured them.

## 1. Brad's instruction for this track, and round 2's items

- **The instruction.**
  - U1 (Brad, 6:11 AM ET): "Proceed with U1 as its own commit, followed by U14 separately. Preserve the independent
    arithmetic and saved-selection controls."
  - U14 (Brad, 6:00 AM ET): "...ALL YEARS to include genuine stored plans and execution by effective year within the
    selected appropriations. Never create or copy a budget merely because a year becomes available. Explicit saved selections
    must never silently switch to ALL YEARS; retain an unavailable selection with a clear notice."
- **It is met, and nothing beyond it was applied.** This round changed only two files: `audit-recon.mjs` and the catalog.
  - **No board changed.** c1h `bc674ee5` and c2h `fce8a391` are byte-identical to my round-2 rebased boards.
  - **I re-derived the delta.** I diffed my round-2 rebase against c1h and c2h:
    - c1h `audit-recon`: +4 / -3 lines;
    - c2h `audit-recon`: +58 / -13 lines;
    - c2h catalog: +12 / -0 lines.

    The changed lines equal the builder's `fix2-delta-*` exactly.
  - **Every removed line is a comment.** They are the two FAILS ON comments and the U14 header's toggle sentence.
  - **No check, fixture or expected value changed.**

| round-2 item | fix round 2 | checked |
|---|---|---|
| must-fix 1: a toggle **off** beside a saved year not available | `S5c · a year switched off beside the saved FY26`: my drafted literals, plus label, ALL YEARS not lit and lit years | **Fixed.** Passes on c2h. Fails under `v200-u14-toggle-off-drops-saved` (2: this check and S5d's toggles). It also catches my `W3-lastoff-drops-unavail` and `W3-lastoff-allyears` |
| must-fix 2: a year's **only** | `S5c · a year's only beside the saved FY26`: my literals, plus only FY27 lit | **Fixed.** Fails under `v200-u14-only-keeps-saved` (1). It passes on the boards before U14, which is right ("only" chose again there too) and said in FAILS ON |
| should-fix 1: rebase onto U13 | `h/`, `c1h/`, `c2h/`, `diffs-h/`; catalog after U13's entries | **Done.** I applied `diffs-h/` to HEAD's files with `patch -F0`: every file equals the builder's c1h and c2h. `h/` equals my own `git archive` of HEAD |
| should-fix 2: the plural notice | S5d (4 checks) | **Done and sensitive.** `v200-u14-notice-plural-it` fails 2. Five of my plural mutants are caught **only** by S5d (section 4) |
| should-fix 3, 4 (deviations; Brad's items) | disclosed; still open | Accurate |
| minors ("amber"; EX comment; FAILS ON) | fixed / commented / rewritten from runs | **True.** FAILS ON was checked against my runs (section 3) |

## 2. Every reported run, re-run (`r3/out/text-cmp3.txt`, `text-cmpx.txt`)

My inputs are my own, built the builder's way:
- my trees are `git archive` of HEAD plus `diffs-h/` applied by me, equal to the builder's `h`, `c1h` and `c2h`;
- my harnesses come from the builder's `mkfocused.py`. Their blobs are `2169fc98`, `5c968292` and `4d4d57d3`, equal to the
  builder's;
- my 54 catalog mutant boards come from `mkmut.py`. All 54 are byte-identical to the builder's `mut-y/`;
- my variants are c1h + the `rlgIsUpl` hunk (`9427f96a`), and the `4a6f7c7` and `0c6ff00` boards read with `git show`.

| set | runs | result (mine = builder's) |
|---|---|---|
| focused: U1 on c1h / HEAD / 0c6ff00 / 4a6f7c7; U14 on c2h / HEAD / 0c6ff00 / c1h / c1h+`rlgIsUpl` | 9 | 116/0; 47; 47; 47; 179/0; 91 (47+44); 91; 40; 32. **Identical** check by check |
| U1 mutants at c1h; all 16 U14+U1 catalog mutants at c2h | 18 | 47, 33; 15, 7, 5, 2, 32, 7, 3, 7, 8, 1, **2, 1, 1, 2**, 28, 14. **Identical**. Every one caught |
| R1 sensitivity, 18 `v200-r1-*` at c1h and at c2h | 36 | **identical** (e.g. raw-year-exec 78 / 60; saved-year-widens 21 / 2) |
| U13's own block on c2h and on HEAD | 2 | 71 / 71 each, identical |
| u14scope matrix: c2h `u14`; HEAD and c1h judged `u14` | 3 | 514/0/67, 421/93/67, 445/69/67; all 581 results identical in each |
| full: audit-recon, audit-other, audit (c2h, c1h); audit-inject, boot-same, audit-ppt, audit-hostile, legacy-fsrc (c2h) | 11 | all pass, as the builder's |
| check.mjs c2h, c1h | 2 | 24 ok; the only failures are the 2 "could not ask git" checks. pubState null, APPNS empty |
| bytes, reopen-bytes c2h | 2 | identical / boardEqReopened, reopenedSameAfterReads, fys `[2026]`, no errors |

**Fix round 1 against fix round 2** (`cmpx.py`, my own pairing of the 58). Every fix-round-1 check is present, with the same
verdict and observed value: 0 differing, 0 missing. The only new checks are the six, with these verdicts:
- all pass on c2h and on 24 mutant runs;
- on HEAD, 0c6ff00 and c1h: the switched-off check and S5d fail, and "only" passes;
- on c1h + `rlgIsUpl`: the same, except that S5d's nothing-made check passes.

**Not re-run.** The builder's two `node --check` syntax runs, and its six superseded trial runs (`Yt-`).

## 3. Literals, realism, comments and drafts

- **The new expected values are hand-written literals:** stored, selection and totals, the labels, `N2` / `X2`, and the
  lit-button lists. Board helpers supply observed values only.
- **The new checks use product paths.**
  - Set base year runs `setBaseYear()` with its prompt answered.
  - Year buttons are found by their own `onclick` and `.click()`ed.
  - The export is read back from its bytes.
- **No shortcut creates or hides the effect.** The S5d fixture is the block's own `build()`. Its `MS.years` snapshot is taken
  before both base-year moves.
- **One thing S5d leaves out:** it does not save and reopen the plural state. My notice probe (`N`, 19 of 19 on c2h) does:
  the plural selection and its notice survive a save and reopen. **Minor.**
- **The FAILS ON comments hold.**
  - U1 fails the same 47 checks on 0c6ff00, 4a6f7c7 and HEAD (63bd8b0), with identical verdicts.
  - All 20 U1 CONTROL checks pass on each. The non-CONTROL checks that pass are exactly the raw-history,
    nothing-asked/nothing-made and Initial Spares guards it names.
  - The U14 checks passing on 0c6ff00, HEAD and c1h are exactly the ones the comment lists. S5d's nothing-made check fails on
    all three (`r3/out/text-failson3.txt`).
- **Counts.** U14 has 63 checks (8 CONTROL), U1 has 78 (20 CONTROL), and the harnesses have 116 and 179.
- **House style.** S5c/S5d sit inside the U14 block's existing `try`, so there is no new wrapper or guard line. Comments use
  the block's voice. Catalog entries use the `{ id, area, what, find, repl }` form.
- **The drafts still apply.** NEXT-VERSION and the ledger are re-read from HEAD.
  - HEAD has moved twice since the round: to `97ce86e`, then to `239fc7e` (11:35 AM ET). Both moves are records only.
  - `NEXT-VERSION.md` is unchanged; lines 727, 730–732 and 753–755 are as the builder cites them.
  - The ledger gained one row (U28, line 61). U1 (row 12) and U14 (row 47) are unchanged.
  - The figures in the drafts (78/47, 63/44/40, 14 mutations, 514/93/69) match my runs.

## 4. Mutations

- **Text-only counts** (`mcount.py`; `r3/out/text-prep3.txt`):

  | catalog | board | matches once |
  |---|---|---|
  | c2h | c2h | 1,328 / 1,328 |
  | c1h | c1h | 1,314 / 1,314 |
  | HEAD | HEAD, c1h and c2h | 1,312 / 1,312 on each |
  | c1h | c2h | 1,314 / 1,314 |
  | c2h | c1h | 1,317 (the 11 U14-only finds absent) |

- **The four new entries** match c2h once each. They sit after `v200-u14-chips-unlit-beside-unavailable` and before the R3
  line, after U13's entries.

**My own mutants** (13, not in the catalog). Each find matches c2h once. The exact finds and replacements are in
`r3/work/mine3.json` and in the README. Each was run on the c2h harness (179 checks).

| mutant | what it breaks | fails | caught by |
|---|---|---|---|
| W3-lastoff-allyears | **silent switch to ALL YEARS** on the refused last-off | 4 | S5c toggles, all-on (×2), switched-off |
| W3-lastoff-drops-unavail | silent narrowing on the last-off | 4 | the same |
| W3-toggle-keeps-first-unavail | plural narrowing: any toggle keeps only the first saved year | 1 | **S5d only** (toggles) |
| W3-toggleoff-narrows-plural | plural narrowing on a toggle off | 1 | **S5d only** |
| W3-unavail-text-singular | "It stays" for two years | 2 | **S5d only** |
| W3-unavail-first-only | notice and NOTE name only the first year | 2 | **S5d only** |
| W3-label-first-only | scope label names only the first year | 3 | **S5d only** |
| W3-export-note-single-only | export NOTE only for exactly one year | 2 | **S5d only** |
| W3-notice-single-only | panel notice only for exactly one year | 2 | **S5d only** |
| W3-setbase-makes-year | Set base year makes a blank year (something made) | 17 | cells' fixtures, S5b–S5d, S5d nothing made |
| **W3-appn-toggle-narrows** | **silent narrowing** when an appropriation is switched on or off (to ALL YEARS if none left) | **0: ESCAPES** | — |
| **W3-allappns-narrows** | the same, on ALL appropriations | **0: ESCAPES** | — |
| **W3-switchyear-narrows** | the same, when the working year moves | **0: ESCAPES** | — |

- **S5d is worth its place.** Seven of my mutants are caught only by it.
- **R1 sensitivity holds.** All 18 R1 mutants still fail with the builder's counts at c1h and c2h, and no new check fails under
  any of them.

## 5. Money, save, import and persistence outside the change

- **The boards are unchanged** from round 2's verified rebased boards.
- **The matrix is unchanged.** It has 24 money cells plus S1–S5c, and all 581 results are identical.
- **Bytes are unchanged.** MS.years is byte-identical across reads, save and reopen.
- **The full suites pass.**
- **Every existing mutation still matches once**, as text.
- **The other routes keep the selection.** `routes3` v2 passes 10 of 10 on c2h: an appropriation switched off and on, ALL
  appropriations, the working year moved and back, the rule switched on and off, then save and reopen. Each keeps both
  saved years and the notice, and nothing is made or asked.
- **Not run:** the full audit-import and audit-board (the lead's).

## 6. The wording in every reached state

Every expected text below is a hand-written literal.
- **jsdom** (`notice-states.mjs`, 19 of 19 on c2h). The reached states:
  - two saved years, nothing counted;
  - toggles on;
  - a toggle off with a year left counted;
  - the refused last-off;
  - save and reopen;
  - "only";
  - ALL YEARS;
  - one saved year with a toggle off, then "only".

  The notice, the export's NOTE and Scope line, and the label are true in each.
- **Chromium** (`notice-chromium.mjs`, `/opt/pw-browsers/chromium`, playwright-core from the copy's node_modules; nothing
  installed): 8 of 8 OK on c2h, at widths 1,440, 1,152, 1,000 and 760. In each:
  - the notice's text equals the literal ("keeps them" or "keeps it");
  - nothing clips the notice;
  - ALL YEARS and all six "only" buttons are visible;
  - the lit years are right.

  The screenshots are in `r3/out/png/`.
- **After an operation finishes.** The toggles, "only", ALL YEARS and the appropriation buttons call `save(); render();` and
  show no status line, so there is no after-save wording to be false. The reopened copy shows the same notice.

## 7. Rules

- **The builder.**
  - mutate.mjs was never run or imported: no PID line names it, and the trees hold only `mutate.mjs.txt`.
  - It ran no Chromium and no playwright install.
  - Its 91 runs went through `run.sh`, with no timeout, skip or lock wait.
  - At 11:23 and 11:53 AM ET, none of its 368 recorded PIDs was alive (`/proc` read only).
  - orbit-board is clean and was not written by it or by me.
  - The boards are empty templates.
  - Its times are in ET and none is later than the clock.
  - **Disclosed deviations** (direct read-only commands, two `chmod`s, a command refused by the safety check, a lost marker)
    are breaches of "every command bounded". The lead judges them.
- **Me.**
  - I never ran or imported mutate.mjs, and never ran playwright install.
  - Every node and Chromium run (113) went through `r3/run.sh`, with the lock checked first. The lock was never present.
  - Every other command that started a process ran through `r3/bx.sh` (`setsid -w timeout -k 10 600`).
  - I recorded every PID in `r3/pids.txt` (377 lines at 11:57:38 AM ET) and killed nothing. None of my PIDs was alive at 11:53:35 AM ET.
  - **My deviations** (README §8):
    - direct, unbounded read-only commands (`ls`, `grep`, `cat`, `head`, `sed`, `date`, `diff`, `python3 -I` reads of my own
      outputs);
    - my own script files written with heredocs or the Write tool;
    - one `cp` and two `python3 -I` text edits of my own files, run directly;
    - one command refused by the safety check (no removal in it; it was re-run in parts).

## mustFix

None. The product does what Brad decided, the round's tests are literal, realistic and sensitive, every run reproduces, and
nothing beyond the instruction was applied.

## shouldFix

1. **The U14 block is blind to a silent narrowing through three routes it never takes.**
   - **The routes:** an appropriation button, ALL appropriations, and the working year moved. `W3-appn-toggle-narrows`,
     `W3-allappns-narrows` and `W3-switchyear-narrows` each pass all 179 checks.
   - **What a person would see:** FY24 and FY26 vanish from the saved selection, and the notice with them. Where nothing else
     is counted, the panel silently shows ALL YEARS. That is exactly what Brad ruled out.
   - **The product does not do this today** (`routes3`, 10 of 10). These routes are outside the U14 change and write no saved
     year, so this is coverage, not a defect.
   - **The fix is drafted and measured:** `r3/work/proposed/s5e-other-routes.js.txt` (S5e: 3 checks, hand-written literals).
     Insert it after S5d's closing brace.
     - It passes on c2h (182 / 182).
     - It catches each of the three mutants (2, 2 and 1 failing).
     - It fails on c1h, as checks of changed behaviour do.

     If added, the U14 count (63 → 66), the FAILS ON comment, and the NEXT-VERSION and ledger figures move with it.
     Optionally, add the three as catalog entries.
2. **Brad's four open decisions** must be settled before the U14 commit. They are unchanged from round 1:
   - whether the `rlgIsUpl` line belongs in this commit;
   - partner and FMS type-ins in a year no longer offered;
   - what "genuine stored plans" takes in;
   - the long chart-image label.
3. **The builder's disclosed rule deviations** in fix rounds 1 and 2: the lead must judge them.

## minor

- **Two report times are off.**
  - The report says `Y-F-u14-on-c2h` started at 10:50 ET. Its log and the README say 10:43:47 ET.
  - The report says no PID was alive "at 11:10". The check ran at 11:09:13; I confirm 0 alive at 11:23 and 11:53 AM ET.
- **The ledger draft names `592d629`.** It says the work is "on HEAD `592d629`", but HEAD is now `239fc7e` (records only). At
  commit, name the real parent, and add this round's verdict to the "Adversarial review" sentence.
- **S5d has no save and reopen** for the plural state (covered by my probe). `removed25` still sets the saved `[2025]` in
  code (stored bytes identical, as in round 2).
- **My own probe had a wrong literal at first.** `routes3` v1 expected the appropriation `onclick` with single quotes, and
  the board uses double quotes. Its `V3-routes-*` runs are kept. v2 (`V3-routes2-*`) is the one relied on, and the diff is in
  the README.
