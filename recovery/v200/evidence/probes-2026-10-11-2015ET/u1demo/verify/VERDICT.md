# VERDICT: U1 demonstration (u1demo): sound, with issues

I verified this on 2026-10-11, 20:40–20:52 ET. The work was read-only on the product. Nothing in `/home/user/orbit-board` was touched; its HEAD moved to 786eb3f from elsewhere during this window, with a clean tree. `u1fix/before`, `u1fix/after` and the builder's files were not modified (checked with `diff -rq` and blobs). Every run was bounded and ran on its own, through `verify/vrun.sh` (`setsid -w timeout -k 10 600`):

- PIDs are in `verify/pids.txt`.
- Exit codes, wall times and start times (ET) are in `verify/logs/runs.txt`.
- No run timed out, and no recorded PID is alive.

## Bottom line

**The U1 money demonstration holds and reproduces exactly.** On the after board (b4c55e38, the proposed U1 line):

- FY26 × {O&M, Initial Spares} = 400, × O&M = 300, × Initial Spares = 100.
- With the genuine plan removed, they read 100 / 0 / 100, with no cloned budget, on the board and on the reopened copy.
- Saved FY25-only selections are preserved.
- On the before board (4d273c06, HEAD), every FY26 check fails because FY26 is not offered: the FY26 selection silently becomes ALL YEARS (540, or 0 for Initial Spares only).

**The expectations are hand-written literals, and the no-clone checks are sensitive.**

**Evidence gaps and wording claims:**

- The saved-FY25 check would not catch the regression it exists for.
- The plan was removed only at state level; the product's own "Reset FY26 to blank" was not used.
- The confirm-count claim is broader than what the probe asserted.
- One wording "defect" is refuted.
- The default of the OBBBA rule is misstated.

I closed each of these gaps with my own runs, and U1 passes all of them.

## Boards, probes and identities

| what | path | blob |
|---|---|---|
| before | `verify/boards/before` (cp -r of `u1fix/before`) | 4d273c0680132caafc4cbc8ca09c1533735c86de (= orbit-board HEAD's board blob) |
| after | `verify/boards/after` (cp -r of `u1fix/after`) | b4c55e38aca79f1310d82f84ca7933321b536b64 |
| boot.mjs / shim | both copies | 9c4f49ad8cec / 6e2ce2e6beda |
| builder probe | `u1demo/u1demo-probe.mjs` (run unchanged) | 80e7240d4b503d64c90b87a853b95900dcc59a07 |
| verifier probe X1–X3 | `verify/v-extra.mjs` | 064d56da998abe63f87bc3623990fe5680b27676 (superseded fbe019aa: two harness bugs of mine, see runs) |
| verifier edge probe | `verify/v-edge.mjs` | 80f4e09536df9d08a7ace6399e0aebe467fa8222 |
| mutant M1 | `verify/mut/m1`, after + `flowPlanHas(){ return true; }` | 40ec4be61d330a991e98660d99c89abe948f14e1 |
| mutant M2 | `verify/mut/m2`, after + a read that asks the roll-forward question and clones the current year into a missing one | 745b15520775dd5a1d29f13aedc7b8e1bf257eec |
| mutant M3 | `verify/mut/m3`, after minus the R1 raw-years line in `flowYears()` | 3f93f62de7970515ee11f20820ec218f31d2652c |

- Each boot asserted that boot.mjs `BOARD` resolves to the copy's `prioritization-board-grid.html`, with `BOARD` unset.
- The shim was imported first.
- `node_modules` is the symlink each copy carries.

## Runs (ET, 11 Oct)

| label | board | exit | wall s | result |
|---|---|---|---|---|
| v-after | after | 0 | 12.4 | 424 passed / 0 failed / 98 recorded. **Identical** to the builder's after-3: all 522 result rows, every scenario read and the summary digest |
| v-before | before | 0 | 12.7 | 148 / 276 (all 276 contract; 0 control or fixture failures). **Identical** to before-2 in the same way |
| x-after-1 | after | 0 | 5.3 | SUPERSEDED: my harness bugs. My export reader kept a non-numeric TOTAL FUNDING cell, and one label literal of mine was wrong (no O&M rows means O&M FY25 is a planned year, so the label adds "· PLANNED (board allocation, O&M)"). Kept in logs. |
| x-after-2 | after | 0 | 5.0 | 27 / 0 |
| x-before | before | 0 | 5.2 | 14 / 13. The FY26 checks fail as expected; X2 and X3 pass |
| mut-m1 | M1 | 0 | 13.5 | 292 / 132 (contract) |
| mut-m2 | M2 | 3 | 14.3 | 264 / 160 (148 contract, 12 control) |
| mut-m3 | M3 | 0 | 14.7 | **424 / 0**: the builder's probe does not see M3 |
| x-mut-m3 | M3 | 0 | 7.2 | 24 / 3: X3 catches M3 |
| edge-after | after | 0 | 2.5 | recorded (see issue 6) |
| edge-before | before | 0 | 2.9 | recorded |

## The six checks asked of the verifier

1. **Reproduction:** exact. The `cmp.mjs` diff of results and scenarios (ignoring paths and timings) shows 0 differences on both boards.
2. **Literal expectations:** yes. `EXP(K)` is all literal arithmetic, such as `(300 + 100) * K` and `(40 + 100 + 500) * K`, and the label and scope strings are literals too. Board helpers appear only as observed values.
3. **Realism:**
   - **Plan:** built on the product path (`switchYear` answered Cancel, then `restoreReq`, `bmSetBase`, `switchYear`) and on the state path. The two agree on every read.
   - **Removal:** state-level only (issue 2). My X1 removes the plan through the product path, and the result is the same money.
   - **Selections:** set through `flowCfg()`. That is the same state `flowOneYear` and `flowToggleAppn` write.
   - **Caveat the builder did not state:** with base 2027 the 🗓 menu does not offer FY26 until it exists (lines 25894–25902). A UI user would need `setBaseYear(2026)` first. The end state is the same.
4. **Control sensitivity:**
   - **M1** (a clone in the money with none in the state): `MS.years[2026]` stays undefined, so every state detector passes. But c4a reads 600 and c4b reads 500, and "no FY26 figure equals 500", "no plan row" and "flowPlanRecs(2026) empty" all fire, on the board and the reopened copy. The money detectors are what catch this case, and they work.
   - **M2** (a read asks the roll-forward question and clones): the 9-step state sequence reads "defined", the confirm count fires, the reopened copy holds FY26, and the money checks fire.
   - **The builder's detector control** (a deliberate roll-forward clone) is also genuine.
   - **M3:** not caught (issue 1).
5. **README against the logs:** every figure, label, box text, chip text, count and blob I checked matches the JSON exactly. The exceptions are issues 5, 7 and 8.
6. **Refutation attempts:**
   - The "fixed" claim survives: X1 (product-path removal), X2 (confirm during the reads with the plan present) and X3 (FY25 holding only carried rows) all pass on the after board.
   - One wording defect is refuted (issue 3), and one is real but not caused by U1 (issue 4).

## Issues

**Should fix:**

1. **The saved-FY25 check (c5) cannot fail for the reason it exists.**
   - The fixture's ordinary O&M FY25 row (40) keeps FY25 offered on its own. So M3, with the R1 line that "keeps a saved FY25 selection FY25 when every FY25 row is counted as FY26" deleted, still passes all 424 checks.
   - My X3 uses the same fixture without the O&M row. On the after board, saved [2025] reopens as [2025], total 0, with only the FY25 chip on (it also passes on before).
   - On M3, X3 fails: the selection silently becomes ALL YEARS (FY26–FY31, $600M).
   - So the conclusion is right, but the builder's evidence for it is not sensitive.
2. **The removal was state-level only, and the product's own removal path was not considered.**
   - `resetYear()` ("🗑 Reset FYxx to blank…", lines 6235 and 25913) is how the product empties a year. It leaves FY26 defined but blank: pot [0], order [], F1 in Removed.
   - My X1 builds the plan exactly as the builder's product path does, then runs `switchYear(2026)` (no prompt), `resetYear()` (one prompt, "Reset FY26 to BLANK?") and `switchYear(2027)`. The results:
     - FY26 × {O&M, IS} / {O&M} / {IS} = 100 / 0 / 100 in flowCalc, the panel ($100.00M / $0.00M / $100.00M) and the export (TOTAL FUNDING twice).
     - ALL YEARS = 640.
     - No figure equals 500, and there is no plan row; `flowPlanRecs(2026,'om')` is empty.
     - confirm is called 0 times during the reads.
     - All of this holds on the board and on the copy reopened from `buildSavedHtml()`.
   - The README should name this path. "No product function deletes a year" is true but incomplete.
3. **Wording claim refuted: the "(1 plan events)" NOTE.**
   - "Plan events" is ORBIT's standing term for imported CCaR rows, executed ones included. Examples are the import summary "n plan events (FY …)" at line 12046, the hint "FY24–FY26 plan events (with the Alloc obligation flag) load" at line 16904, and the flow drill-downs.
   - The NOTE does not mislabel executed money as planned. Only the plural "1 plan events" is a nit.
4. **Wording claim real, but not introduced by U1.** After removal, the label says "FY26: O&M planned", the chip says "FY26 · plan", and the tooltip and box say O&M "is answered from / reads O&M's own allocation" over $0.
   - The same wording already appears on both boards for FY28–FY31, which hold no year state at all.
   - U1 extends existing behaviour to FY26. The product elsewhere does say "holds no plan yet" and "not started" (lines 18967, 20190, 25901), so the inconsistency is genuine but older than U1.
   - The README should say this, so the U1 change is not blamed for it.
5. **The confirm-count claim is broader than what was asserted.**
   - The probe zeroes the confirm counter at the removal step (line 273) without checking it. The reads made while the plan was present (c1–c3, ALL YEARS with the plan, and the c5 save) were never asserted.
   - The c7 check named "confirm not called since the fixture was built" covers only the period from removal onward.
   - My X2 asserts that the count over those reads is 0 on both boards, so the README's conclusion is true, but the probe did not show it.
6. **"The default OBBBA rule (on …)" is inaccurate.** The product default is off (`flowPseudoDef`, `on:false`, line 15391); the fixture switches the rule on with its default token, years and column.
   - With the rule off (edge probe) and the same genuine FY26 plan, the after board does not offer FY26.
   - The $300 own plan is then in no year: ALL YEARS reads 640 (140 executed, 500 planned), where 40 + 100 + 300 + 500 = 940 would hold every dollar.
   - An FY26 × O&M selection silently falls back to ALL YEARS (540).
   - The before board behaves the same, so this is not a regression. But "own-only gives $300" depends on a row being counted in FY26, because U1 offers years where rows are counted, not plan years outside the FYDP window. Whoever owns U1 should state that scope.

**Minor:**

7. The README says the run took place at "20:19–20:35 ET". The README was last written at 20:29:57 ET, and the runs were at 20:26–20:28 ET, so the stated end time is after the file was written.
8. The superseded probe versions are neither kept nor named. after-1 used blob bde44e94; after-2 and before-1 used 4e09cd57. Those runs' outputs are kept, but the runs cannot be reproduced.
   - The split of the detector control after before-1 is disclosed and justified, because the money part needs FY26 offered.

## Files

- **This verdict:** `verify/VERDICT.md`
- **Logs:** `verify/logs/*.log` and `verify/logs/runs.txt`
- **Results:** `verify/out/*.json`. Rerun digests are in `verify/out/v-*.summary.txt`, identical to the builder's.
- **PIDs:** `verify/pids.txt`
- **Comparison helpers:** `verify/cmp.mjs` and `verify/show.mjs`
- **Mutants:** `verify/mut/m{1,2,3}`
