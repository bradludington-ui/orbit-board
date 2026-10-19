# U14 scope map: adversarial verification

Verified 11 Oct 2026, 21:52–22:09 ET. Measured runs: 21:53–22:08 ET.

**Verdict: sound, with issues.** Every measured claim in `../README.md` reproduces exactly on both boards. Every check compares against a hand-written literal. The U14 effect is not caused by the builder's construction order, and every control I mutated proved sensitive. The issues are all wording and completeness problems in the README. None of them changes a number or a conclusion. No correction is proposed here. The mutants below are disposable detectors, not candidate fixes.

## Hard rules: how I kept them

- **orbit-board was read only.** `/home/user/orbit-board` stayed clean at `17701c2`, with an empty `git status`. I read files and git history there and nothing else.
- **orbit-ui was not touched.** I made one `ls` of its top directory and did nothing more. The probe, `run.sh` and `boot.mjs` contain no reference to orbit-ui.
- **u1fix was not modified.** Its board blobs are unchanged: `u1fix/after` is `b4c55e38` and `u1fix/before` is `4d273c06`.
- **The builder's files were not modified.** I re-ran `u14-probe.mjs` unchanged, from its own path. The builder's `run.sh` writes to the builder's `pids.txt` and `logs/`, so I used `verify/vrun.sh` instead. It is that file with only `U=` pointing at `verify/` (blob `38057484`).
- **No forbidden tools ran.** No full suite, gate, mutate, `mutate.mjs`, `verify:grid`, standards or playwright install.
- **Every run was bounded and run alone.** Each one used `setsid -w timeout -k 10 600`, one at a time. The PIDs are in `verify/pids.txt` (24 PIDs, none alive at 22:08 ET). Each run's line is in `verify/logs/runs.txt`. All runs exited 0 and none timed out.

## 1. Re-runs of the builder's probe (unchanged, blob `4a03d09d`)

| label | board (blob) | expect-as | exit | wall s | passed / failed / recorded | compared with the builder's output |
|---|---|---|---|---|---|---|
| v-before | before `4d273c06` | before | 0 | 53.3 | 397 / 0 / 64 | **0 differences** from `out/before-2.json` (`cmpout.mjs`; ignores timings and paths) |
| v-after | after `b4c55e38` | after | 0 | 58.2 | 404 / 0 / 64 | **0 differences** from `out/after-2.json` |
| v-xsens-before-as-after | before | after | 0 | 63.8 | 382 / 22 / 64 | **0 differences** from `out/xsens-before-as-after.json` |
| v-xsens-after-as-before | after | before | 0 | 56.5 | 379 / 18 / 64 | **0 differences** from `out/xsens-after-as-before.json` |

**Other identity checks:**

- **Both runs used their own board.** Each run booted its copy's own `boot.mjs` (`9c4f49ad`) with `BOARD` unset, asserted it resolved to the copy's board, and imported the shim (`6e2ce2e6`) first.
- **The board copies are what they claim.** `4d273c06` is `17701c2`'s board. `b4c55e38` differs from it in exactly the one `flowYears` line plus its comment.
- **The v1 runs give the same observations as v2.** Matched by key, the matrix and the selections are identical with v2's added export reads removed. Of the results matched by (scenario, name), 460 on before and 466 on after are equal and none differ. The builder's claim holds.
- **The README matrix matches my re-runs.** I regenerated it from my re-runs with the builder's `gen-tables.mjs` and normalised wording ("same", bold, row names). All 24 rows equal the README table.

## 2. Are the expectations literal?

Yes.

- **The matrix.** `EXP` is a hand-typed table (`40 + 100 + 500 + 300` and so on). Every matrix expectation is either an entry in it or derived from one: `toFixed(2)`, `offered26 = E.off[bi].includes(2026)`, and `missing = every − all`.
- **The selection scenarios.** These use literals only: `140 * M`, `[2025, 2027]`, and `O27` (the offered-year list, typed out).
- **Board helpers are read only for observed values.**
- **One redundant check.** "Every dollar minus ALL YEARS = money in no offered year" reduces algebraically to the ALL YEARS check (both sides subtract from the same literal). It adds about 24 passes per board but is not wrong. The README describes that column honestly as "hand-written every-dollar total minus the measured ALL YEARS".

## 3. Realism: product paths, shortcuts, and whether a shortcut creates or hides the effect

**What the builder disclosed accurately:**

- The workbook was seeded at state level, into `EXDB.all`.
- The initial FY27 board was set through state after `seed()`.
- Rule ON was set in the matrix by calling the chip's handler `flowSetPseudo('on', true)`.
- The panel is opened with `flowOpen=true`.

The rule chip is rendered unconditionally (line 16440), so rule ON with no carried row (cells 7 and 8) is a state a user can reach.

**The construction order does not cause the effect.** The builder built FY27 first and then created FY26 around a 2026→2027 base move. My own probe, `verify/u14-refute.mjs` (blob `8f1b7975`), uses the natural chronology instead:

1. An FY26 board (base 2026, cur 2026, own FY26 pot 300).
2. `switchYear(2027)` answered OK. This is the product's "ROLL FORWARD: start FY27 from a copy of FY26", with one confirm. FY27's pot comes over as 300 and is then set to 500 with `bmSetBase`.
3. Then "Set base year" 2027.

Results, on **both** boards (14 passed, 0 failed each):

| step | offered | ALL YEARS |
|---|---|---|
| before the base move | FY25–FY30 | 940 = 140 executed + 800 planned |
| after the base move | FY25, FY27–FY31 | **640** = 140 executed + 500 planned |

- After the base move, `flowCalc(2026)` = 300, the panel shows $640.00M with no mention of FY26, the export TOTAL FUNDING reads 640 ×2, and the Scope line equals the label. All of this is unchanged on the reopened copy.
- The rule chip, clicked ON afterwards: before board 540; after board 940 (FY26 offered).
- **An FY26 selection made before the base move falls back the same way.** It is 300, with export 300 ×2, which the builder did not read. After the move it becomes ALL YEARS 640, stored `[2026]`, and stays so on the reopened copy with export 640 ×2.
- **No jsdom errors** on any board or reopened copy in these paths. The builder checked jsdom errors only in the matrix and in S1.
- **This probe is sensitive.** On mutant m1 (below) it fails 6 of its 14 checks.

**The precondition, stated plainly.** The README states it correctly: U14 needs no workbook row *filed* in FY26 in **any** appropriation (on the U1 board, none *counted* there). It also needs the base moved past a year the board holds a plan for, or the user working outside the window (X1). One more route, by code reading only and not measured: `normalizeStore` (line 5972) gives a saved file with no `base` the value `BASE_FY_DEFAULT` = 2027.

## 4. Are the controls sensitive?

These are one-line disposable mutants of the before board, kept in `verify/mut/` only. They detect; they are not proposals.

| mutant | the line changed | board blob | result | what it shows |
|---|---|---|---|---|
| m1-fy26-offered | `flowYears`: `+ y[2026]=1;` (hard-coded) | `3f933820` | 334 / **63 failed** | **The U14 cells are sensitive.** Cells 1, 3 and 7 fail all 8 checks: offer, ALL YEARS ×3, panel, chip26, export, sel26. S3a, S3b, S4a, S4b (4 checks), S4c (2), S4e and X1 also fail. The builder had no mutant for these cells. |
| m2-fallback-first | `flowSelYears`: an empty intersection falls back to the first offered year instead of all of them | `0fdc161c` | 393 / **4 failed** | S4b's broadening checks (board, reopened, export, toggle) catch a different fallback. S4b is identical on both boards, so the cross-runs could not test it. |
| m3-keep-2026 | `flowSelYears`: the filter also keeps 2026 | `e4b97bac` | 391 / **6 failed** | The S4b and S4c checks would catch a selection that was kept (S4b 300; S4c 440). |
| m4-no-fy26-plan | `flowPlanHas`: 2026 holds nothing | `33911935` | 329 / **68 failed** | **The positive controls are live.** These are direct26 in every plan cell, 840/940/847, S3c, S3d, S4b, S4c, S4d and X1. Cells 1, 3 and 7's ALL YEARS (540 and 640) do **not** change under m4. Only the direct `flowCalc(2026)` check tells "plan excluded" apart from "plan holds nothing". The builder's reliance on that positive control was necessary and correct. |
| m5-reopen-drops-fys | `flowCfg`: the first call in a window clears a saved `fys` | `adc50046` | 388 / **9 failed** | Every reopen check fails: S1, S1b, S2, S2f, S3c, S3d, S4b, S4c and S4d. So "preserved through save and reopen" is a real test. |

**What the builder's cross-runs established.** They correctly show sensitivity only where the boards differ: cells 9 and 10, S3b and S4a. That gives 22 and 18 failures, reproduced exactly. The mutants above close the remaining gap: the U14 cells, the both-board selection scenarios, and reopen.

## 5. README claims checked against the logs and the code

**Confirmed:**

- **The code statements in section (1).** `flowSelYears`, `flowToggleYear`, `flowAllYears`, `flowYears`, `flowPlanYears`, `flowExecYears`, `flowEffFy`, `flowPlanHas`, `flowPlanRecs`, `flowCalc` and `exportFlow` (which calls `flowCalc()`). The cited line numbers on `4d273c06` are correct.
- **The formulas.** The offered set is W ∪ R on before and W ∪ R ∪ E on after. ALL YEARS money is counted rows plus the own plan for offered years with no own counted row.
- **The other scopes.** `rlgAllYears` = window ∪ `MS.years` ∪ `MS.cur`. `fydpWindow` = window ∪ `MS.cur`. The 🗓 menu's "(outside window)" entries (lines 25894–25900) and the PPBE "outside the window … still counted" text are as quoted.
- **The ledger correction is right.** `git log -S` shows the "FYDP WINDOW, never the years that happen to carry state" comment and the ALL YEARS tooltip each appear in only one commit, `2154832`. The R1 comments ("a saved year stays offered", the `raw` comment) arrive in `3aeda74`. `UNRESOLVED-LEDGER.md` U14 does attribute the comment to R1.
- **Main and pre-R1 use the same formula.** Main (`f9b4413`, board `b160bc03`, which does not contain R1) and pre-R1 (`3aeda74^`) both define `flowYears = flowExecYears() ∪ flowPlanYears()`, with `flowExecYears()` the non-empty filed years. That is the same W ∪ R. This is code reading; I did not run main either.
- **The recorded observations.**
  - The menu text "FY26 (outside window)has data" appears in cells 1, 3, 7 and 9.
  - The panel mentions FY26 0 times in cells 1, 3 and 7 and in the S4a and S4b fallbacks.
  - X1: `fydpWindow` and `rlgAllYears` = [2026–2031].
  - In all 24 cells on both boards, the export Scope line equals "Scope: " + `F.label`. I checked every cell; the builder checked only the ones it quoted.
- **The selection table (S1–S4e) and X1.** Every value matches.

## 6. Refutation attempts

All of these failed to refute a claim:

- **Construction order.** U14 holds in the natural chronology (section 3).
- **A hidden jsdom error in the fallback paths.** There is none (section 3).
- **"Offering never depends on the plan".** True by code: `flowYears` never reads `MS.years`. It is measured too: S4d keeps FY26 offered after `resetYear`, and S4e leaves offering unchanged.
- **"U1 changes only cells 9 and 10".** The cross-runs fail only there, plus S3b and S4a.
- **"An FY26 selection falls back to ALL YEARS" in the U14 state itself.** It cannot be made at all (S3a: there is no chip and no "only" button). The fallback needs FY26 to have been offered when it was chosen (S4a, S4b, R2). The README says this. The ledger's U14 wording ("an FY26 selection silently falls back") is looser than the evidence.

## Issues

**Should fix (README wording and completeness; no number changes):**

1. **The ALL YEARS label itself claims FY26, and the README does not say so.** In cells 1–4 and 7–8 on both boards, and cells 9–10 on before, the label and export Scope read "FY25–FY31 · all years · all appropriations · FY27, FY28, FY29, FY30, FY31 planned, the rest executed". The en-dash range covers FY26, and "the rest executed" reads as FY25 *and FY26* executed, yet FY26 is in no total. It happens even where FY26 holds $0 (cells 2, 4 and 8). The cause is `flowScopeLabel` printing first–last whenever every offered year is selected, with no check for gaps. The README quotes the label but does not state this, and Brad asked for a plain statement of what is silently excluded.
2. **The time of `2154832` is not given in ET.** The README (twice) and the summary say "12 Sep". The commit is 2026-09-12 01:37:59 +0000, which is **11 Sep 2026, 9:37 PM ET**.

**Minor:**

3. **"Labels, measured" overstates two things.**
   - The labels, the 🗓 menu text and "the same on panel and export Scope" are recorded observations, not literal checks. The only literal checks are the S4a and S4b export Scope lines.
   - The panel's own label text is never read. `F.label` from `flowCalc` is. I confirmed that export Scope equals `F.label` in every cell.
4. **"In no total and in no export" is broader than the evidence.** It means the funds-flow panel and the funds-flow export. In the same cells, realignment (`rlgAllYears`) includes FY26 and the 🗓 menu lists it. The README's own section (1) shows this.
5. **One U1 consequence could be stated outright.** The U1 line makes the offered set depend on the carryover rule. That creates a new route to silent broadening (S4a: rule switched off) that the current board does not have, because its offered set is rule-independent. The README gives the facts, but not the conclusion: U1 adds this broadening path.
6. **Two coverage gaps are disclosed:**
   - Per-cell labels are in the JSON, not in the README matrix.
   - The builder had no sensitivity evidence for the U14 cells, the both-board selections or reopen (README: "No mutant was built"). Mutants m1–m5 above now supply it.

## Files (verify/)

- **Docs:** `VERDICT.md` (this file).
- **Scripts:**
  - `vrun.sh` `38057484`
  - `cmpout.mjs` `0217fb75`
  - `u14-refute.mjs` `8f1b7975`
- **Run records:** `pids.txt`; `logs/*.log`; `logs/runs.txt`.
- **Outputs:**
  - `out/v-*.json` (re-runs)
  - `out/mut-m*.json` (mutants)
  - `out/refute-*.json`
  - `out/table-*.md` (the README table, and the same table regenerated from the re-runs)
- **Mutant copies:** `mut/m1…m5/`. Each holds the before board's `tools`, shim and `package.json`, a `node_modules` symlink, and one changed board line. Their blobs are in the table in section 4.
