# U1 demonstration: genuine own FY26 plan + other-appropriation carried execution

Run 2026-10-11, 20:19–20:35 ET. This work was read-only on the product. Nothing in `/home/user/orbit-board` was edited, staged, committed or pushed, and `u1fix/before` and `u1fix/after` were not modified (`diff -rq` against the copies shows them identical). Every run was bounded and ran on its own: `setsid -w timeout -k 10 600`, through `run.sh`. The PIDs are in `pids.txt` and the exit codes and wall times in `logs/runs.txt`. No run timed out, and no recorded PID is still alive.

## Boards and identities

| label | path booted (boot.mjs `BOARD`, asserted) | board blob | boot.mjs blob | shim blob |
|---|---|---|---|---|
| before | `u1demo/boards/before/prioritization-board-grid.html` (cp -r of `u1fix/before`) | `4d273c0680132caafc4cbc8ca09c1533735c86de` (= HEAD and 4a6f7c7 `prioritization-board-grid.html`) | `9c4f49ad8cec537097bdf485458cfd2a09b06594` | `6e2ce2e6beda9e7526527530500f254d877d0320` |
| after | `u1demo/boards/after/prioritization-board-grid.html` (cp -r of `u1fix/after`) | `b4c55e38aca79f1310d82f84ca7933321b536b64` (before + the proposed U1 line in `flowYears()`) | same | same |

- The two `tools/` trees are identical.
- `node_modules` is the symlink each copy already had.
- Probe: `u1demo-probe.mjs`, blob `80e7240d4b503d64c90b87a853b95900dcc59a07`.
- Final runs: `after-3` (exit 0, 12.7 s) and `before-2` (exit 0, 11.8 s). Results are in `out/after-3.json` and `out/before-2.json`, with digests in `out/*.summary.txt`.
- Superseded runs, kept but not used: `after-1` and `after-2` (earlier probe versions, both exit 0 with every check passing) and `before-1`. `before-1` exited 3 because its detector control also asserted the FY26 money, and that presupposes FY26 is offered. The final probe splits that control, as described under Controls below.

## Fixture (literal, whole dollars, synthetic)

- **Board:** O&M (`mySlug()='om'`), one service USAF, and one requirement F1 asking 1000.
- **Plan window:** FY27–FY31 (`MS.base=2027`, `MS.cur=2027`, `FYMON=fyMonths(2027)`). The FY27 pot is **500**.
- **Genuine own FY26 plan:** a pot of **300**. It was built two ways, and both ran on both boards:
  - **PRODUCT path:** `switchYear(2026)`, with `window.confirm` answering Cancel.
    - That gives a BLANK year from `freshYearState()`: pot `[0]`, order `[]`, Removed `['F1']`.
    - `restoreReq('F1')` then brings F1 back from the Removed list. This step is needed: a blank year with F1 still in Removed funds nothing.
    - `bmSetBase('disc',0,'300')` sets the pot, and `switchYear(2027)` returns to FY27.
    - `confirm` was called exactly once, with "FY26 has no data yet…".
  - **STATE path:** audit-recon R1's shortcut: a JSON copy of S with `st.bm={disc:[300],mand:[0],adds:[]}`, `st.discSvc=[300]`, `MS.years[2026]=st`.
  - **Agreement:** on both boards and at both scales, the two paths give identical observed figures for checks 1–4 and 6, across flowCalc, the panel and the export (the `agree` control).
- **Workbook (EXDB.all, 32-column CCaR rows):**
  - Initial Spares, filed FY2025, Budget cell `USAF Spares Initial Mandatory PSM`, **100**. It counts in FY26 under the default OBBBA rule (on; token `OBBBA, Mandatory`; 2025→2026; col 4).
  - O&M, filed FY2025, `USAF O&M Discretionary`, **40**. This row is ordinary and counts in FY25.
  - No row is filed under FY2026. The carryover rule is on.
- **Scale:** the fixture ran at **K=1** (the literal amounts) and at **K=1,000,000** (the same fixture in millions).
  - The panel prints money as $M to two decimals (`fM2`), so at K=1 every panel figure reads `$0.00M`.
  - Panel checks are therefore made at K=1,000,000 and only recorded at K=1.
  - flowCalc and the export are checked at both scales.

All expected values are hand-written arithmetic of these amounts (for example `(300 + 100) * K`). No ORBIT helper computes an expectation.

## Checks: expected vs observed (product path shown; the state path is identical)

| # | scope | expected (literal) | AFTER b4c55e38 | BEFORE 4d273c06 |
|---|---|---|---|---|
| 1 | FY26 offered | flowYears = [2025,2026,2027…2031] | **pass** | **fail**: [2025,2027,…,2031], no FY26 |
| 1 | FY26 × {O&M, Initial Spares} | flowCalc 300+100 = **400** (exec 100, plan 300). Panel `$400.00M`. Export TOTAL FUNDING 400 ×2, US SERVICE FUNDING 400, O&M 300, INITIAL SPARES 100. Mix box and NOTE present. | **pass**: 400/100/300; panel `$400.00M`; box "...$100.00M executed, $300.00M planned."; export [400,400], [400], O&M [300], SP [100]; NOTE present | **fail**: the selection silently becomes ALL YEARS [2025,2027–2031]: 540 (40 exec + 500 plan); export O&M 540, SP 0 |
| 2 | FY26 × {O&M} | **300**, all planned; no mix box; no NOTE | **pass**: 300/0/300; panel `$300.00M`; box "FY26 is PLANNED, not executed." | **fail**: all years, 540 |
| 3 | FY26 × {Initial Spares} | **100**, all executed | **pass**: 100/100/0; panel `$100.00M`; export SP [100]; OBBBA NOTE "includes 100 ... counted here as FY2026" | **fail**: all years, **0**. The carried 100 is in no year. |
| 4 | plan REMOVED, FY26 × {O&M, IS} | **100** | **pass**: 100/100/0; export O&M [0], SP [100] | **fail**: 540 |
| 4 | removed, FY26 × {O&M} | **0** | **pass**: 0; export [0,0] | **fail**: 540 |
| 4 | removed, FY26 × {IS} | **100** | **pass**: 100 | **fail**: 0 |
| 4 | no cloned budget | `MS.years[2026]` undefined after each flowCalc, panel and export read (9 steps) and on the reopened copy; `flowPlanRecs(2026,'om')`=[]; no FY26 figure = 500 (flowCalc, every export cell, panel $M); no plan row; `confirm` called 0 times | **pass** on the board and on the copy reopened from `buildSavedHtml()` | **pass** for the state checks (no clone appears there either). It **fails** "no figure = 500" only because the FY26 selection fell back to all years, which hold FY27's 500. |
| 4 | FY26 chip after removal | recorded | text `FY26 · plan`; tooltip "FY2026 has no O&M execution imported, so O&M is answered from this board's own allocation; other appropriations' execution for it is read from their import" (the same on the reopened copy) | no FY26 chip |
| 5 | saved FY25 only, reopened (plan present, and after removal) | saved [2025], selection [2025], total **40**, label `FY25 · all appropriations`, carried row absent, only `FY25` chip on, export Scope FY25, TOTAL FUNDING 40 ×2 | **pass** (both) | **pass** (both) |
| 6 | ALL YEARS with the plan | 40+100+300+500 = **940** (exec 140, plan 800); export 940 ×2 | **pass**: per year FY25 40, FY26 400, FY27 500, FY28–31 0 | **fail**: 540 (40 + 500) |
| 6 | ALL YEARS after removal | 40+100+500 = **640** (exec 140, plan 500) | **pass**, also on the reopened copy | **fail**: 540 |
| 7 | raw history | EXDB.all byte-identical to the fixture before and after every read, on the board and on every reopened copy; no jsdom errors | **pass** | **pass** |

Final counts:

- **AFTER:** 424 passed, 0 failed, 98 recorded-only.
- **BEFORE:** 148 passed, 276 failed. Every failure is a contract check. Control and fixture checks: 0 failed.

On BEFORE, the 2 "passes" in check 1 (mix box and NOTE present) and the 2 in check 3 are coincidental: the all-years fallback is itself mixed (or, for Initial Spares alone, unmixed).

### Scope labels and panel boxes (K=1,000,000, AFTER)

- **c1:** Label `FY26 · O&M + INITIAL SPARES · FY26: O&M planned, INITIAL SPARES executed · + OBBBA FY25`. Boxes: the planned-and-executed box only.
- **c2:** Label `FY26 · O&M · PLANNED (board allocation, O&M)`. Box: "FY26 is PLANNED, not executed. … reads O&M's own allocation…".
- **c3:** Label `FY26 · INITIAL SPARES · + OBBBA FY25`. No box.
- **c4a, after removal:** The label is still `… FY26: O&M planned, INITIAL SPARES executed …`, with no box. The export has O&M 0, and the only NOTE is the OBBBA one.
- **c4b, after removal:** The label is still `FY26 · O&M · PLANNED (board allocation, O&M)`, with the box "FY26 is PLANNED … reads O&M's own allocation for it" over a $0.00M total.
- **c4c:** As c3.

## Controls

- **Fixture controls:**
  - FY27 pot 500; FY26 pot 300 held in its own object (`MS.years[2026] !== MS.years[2027]`).
  - `flowPlanRecs(2026,'om')` = USAF 300 on F1, and `flowPlanRecs(2027,'om')` = USAF 500.
  - Workbook years = [2025] only.
  - The rule is on, FY2025→FY2026, col 4.
  - The product path asked `confirm` once.
- **Reads did not alter the plan:** after checks 1–3, FY26 was still 300 and FY27 still 500.
- **Detector control** (the no-clone detectors can fire): after everything else, `switchYear(2026)` answered OK (a roll-forward copy) and returned.
  - On both boards: `MS.years[2026]` is defined with pot 500 and `confirm` was asked once.
  - On AFTER: FY26 × O&M then reads 500 planned.
  - On BEFORE: the money part fails (540) because FY26 is not offered there.
- **During reads,** `confirm` answered OK, which is boot's default and the worst case because it would make a roll-forward clone. It was counted, and the count stayed 0.

## Caveats (said plainly)

- **Removal is state-level.** I found no product function that deletes a year (grep for year deletion and removal turned up none), so the plan was removed with `delete MS.years[2026]; save()`, and the reopened copy came from `buildSavedHtml()`.
- **Selections were set through state.** Year and appropriation selections were set with `flowCfg().fys` and `flowCfg().aps`, as in carry-probe, not by clicking the chips. A selection-honoured check (`flowSelYears`/`flowSelAppns`) confirms each one.
- **Panel figures need the ×1,000,000 run.** At K=1 the panel is not checkable (`$0.00M`). Its figures are verified on the ×1,000,000 run of the same fixture.
- **jsdom only, not a real browser.** The setup used boot.mjs stubs and the copy's runtime-encoding shim.
- **Wording observations on AFTER, not U1 money failures.** After the genuine FY26 plan is removed:
  - The money is right (100 / 0 / 100) and nothing is cloned.
  - However, the scope label still says "FY26: O&M planned", and the FY26 chip tooltip and the c4b box still say O&M "is answered from / reads O&M's own allocation" for FY26, although no FY26 allocation exists. They report $0 without saying the year has no plan.
  - The export's OBBBA NOTE counts the carried executed row as "(1 plan events)".
  - These are recorded for whoever owns the wording. No check here asserts them.
