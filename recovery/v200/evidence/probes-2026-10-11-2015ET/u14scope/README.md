# U14: the ALL YEARS scope and the carryover controls, mapped (no correction proposed)

Brad, 9:08 PM ET: "Keep U14 separate. Show the intended ALL YEARS scope and carryover-off/on controls before proposing a correction. Preserve explicit selections; don't silently broaden them." This directory maps the scope and measures it. **It proposes no fix and builds none.**

Work: 11 Oct 2026, 21:31–21:51 ET. Measured runs: 21:38–21:45 ET. Read-only on the product:

- Nothing in `/home/user/orbit-board` was edited, staged, committed or pushed. `git status` is empty and HEAD is `17701c2` throughout.
- `/home/user/orbit-ui` was not touched.
- `u1fix/*` was not modified. `diff -rq u1fix/after boards/after` shows them identical, and the `u1fix/after` and `u1fix/before` board blobs are unchanged.
- Every run was bounded and ran on its own (`run.sh`: `setsid -w timeout -k 10 600`). The PIDs are in `pids.txt`, and exit codes, wall times and start times (ET) are in `logs/runs.txt`.
- No run timed out, and no recorded PID is alive.
- No full suite, gate, mutate, `verify:grid` or standards run was made. `tools/export-audit/mutate.mjs` was not read or run.

## Bottom line (plain)

**Silently excluded today (both boards):**

- **What:** a plan the board holds for its own appropriation in a year outside the FYDP window. Here that is the own FY26 plan, $300M, with the window at FY27–FY31.
- **When:** it is in no offered year, in no total and in no export whenever no workbook row is *filed* under FY26. On the U1 board, also when no row is *counted* in FY26.
- **Rule independence:** this happens with the carryover rule OFF and with it ON (matrix cells 1, 3 and 7).
- **What the screens show:**
  - ALL YEARS reads $540M or $640M where the board holds $840M or $940M.
  - The ALL YEARS label reads "FY25–FY31 · all years". Its tooltip reads "Every year this board can answer for — executed and planned together".
  - The panel text never mentions FY26.
  - The export's Scope line and TOTAL FUNDING agree with the panel.
  - Meanwhile the board's own 🗓 year menu lists an "FY26 (outside window)" entry marked "has data".
- **Not changed by U1:** the proposed U1 line (board `b4c55e38`) does not change any of these cells.

**Silently excluded on the current board (`4d273c06`) only:** the U1 money. With the rule ON, the carried Initial Spares $100M counts in FY26 and is in no offered year (cells 9 and 10). The U1 line fixes exactly those two cells and nothing else in the matrix.

**Also excluded (both boards):** while the user is *working in* FY26 (`MS.cur` 2026, window FY27–FY31), FY26 is not offered (X1). ALL YEARS is then 640, and FY26 asked directly holds 300.

**With the window covering FY26 (base 2026):** nothing is excluded in any cell, with the rule on or off.

**Explicit selections preserved through save and reopen on both boards:**

- FY25-only: 140 with the rule off, 40 with it on.
- [FY25, FY27]: 640 on the U14 fixture; 540 on the fixture where ALL YEARS is 847.
- An explicit FY26, wherever FY26 is offered: 300 at base 2026, 307 with an FY26-filed row, and 400 on the after board with the rule on.

**Silently broadened today:** a saved FY26-only selection whose year stops being offered becomes ALL YEARS.

- **Totals:** 300 becomes 640, or 400 becomes 640.
- **What the screen shows:** the ALL YEARS chip turns on, and the export Scope reads "FY25–FY31 · all years …". Nothing says that the saved FY26 selection was replaced.
- **Where it was shown:**
  - On **both boards**, by moving the base year 2026 → 2027 (S4b).
  - On the **after board**, by switching the carryover rule off (S4a). On the before board this sequence cannot start, because FY26 is never offered there with the rule on at base 2027.
- **The saved file still holds `fys:[2026]`.** It applies again if FY26 becomes offered again (S4a: the rule switched back on gives FY26, 400). Any chip click while in the fallback overwrites it (S4b: toggling FY27 stores [FY25, FY28–FY31], and [2026] is gone).

**Silently narrowed today (both boards):** [FY25, FY26] becomes [FY25] when FY26 stops being offered (S4c). The total goes 440 → 140, with the FY26 chip simply gone.

**Removing the plan changes no offer** (S4d, S4e): offering never depends on whether a plan is present.

## Boards, tools and identities

| label | booted (boot.mjs `BOARD` unset and asserted to be the copy's board) | board blob | made from |
|---|---|---|---|
| before | `boards/before/prioritization-board-grid.html` | `4d273c0680132caafc4cbc8ca09c1533735c86de` (HEAD `17701c2`'s board, = 4a6f7c7) | `git -C /home/user/orbit-board archive 17701c2 prioritization-board-grid.html tools package.json` |
| after | `boards/after/prioritization-board-grid.html` | `b4c55e38aca79f1310d82f84ca7933321b536b64` (before + the one proposed U1 line in `flowYears()`) | `cp -r u1fix/after/.`, which is identical to `u1fix/after` |

- **`tools/` trees:** identical except `tools/export-audit/focused-u1.mjs` (blob `36c6835d`), which exists only in the after copy, carried over from `u1fix/after`. It was not run.
- **boot.mjs:** `9c4f49ad8cec537097bdf485458cfd2a09b06594` in both copies.
- **Shim:** `runtime-encoding-shim.mjs` `6e2ce2e6beda9e7526527530500f254d877d0320`, copied from `recovery/v200/probes/received-2026-10-11/` and imported first.
- **`node_modules`:** a symlink to `/home/user/orbit-board/node_modules`.
- **Probe:** `u14-probe.mjs`, blob `4a03d09db8a4765b5d4b00247ae5ab09426d1c4a` (final, v2). The superseded v1 is kept as `u14-probe-v1.mjs`, blob `90422cbabb8c00e5d02f29d969bcf3c8f4815d2a`.
  - v2 only adds an export read in the S4a and S4b fallbacks, plus the `U14_EXPECT_AS` switch used by the sensitivity runs.
  - v1 and v2 give identical matrix and selection observations on both boards (compared).
- **Helpers (observed values only):** `summarize.mjs` `46771272`, `gen-tables.mjs` `f34765f8` (prints the matrix below from the JSON), `run.sh` `020a4c1b`.

## Runs (11 Oct, ET)

| label | board | probe | exit | wall s | result |
|---|---|---|---|---|---|
| before-1 | before | v1 | 0 | 48.3 | 396 passed / 0 failed / 64 recorded (superseded by before-2, identical observations) |
| after-1 | after | v1 | 0 | 51.8 | 402 / 0 / 64 (superseded by after-2, identical observations) |
| **before-2** | before | v2 | 0 | 50.7 | **397 / 0 / 64** (`out/before-2.json`) |
| **after-2** | after | v2 | 0 | 53.0 | **404 / 0 / 64** (`out/after-2.json`) |
| xsens-before-as-after | before, judged by the after column | v2 | 0 | 55.4 | 382 / **22 failed**: cells 9 and 10 (8 checks each), S3b (2) and S4a (4) |
| xsens-after-as-before | after, judged by the before column | v2 | 0 | 57.3 | 379 / **18 failed**: cells 9 and 10 (8 each), S3b (1) and S4a (1) |

In the main runs every check passed against its board's own hand-written literal column, so the matrix below is the boards' measured behaviour. The sensitivity section explains why those passes mean something.

## (1) What ALL YEARS includes today, from the code

Line numbers are for `4d273c06`. The after board's lines from `flowYears` on are 1–2 higher.

**Selection.**

- `flowSelYears()` (15331): `sel = C.fys ∩ flowYears()`. It returns `sel` if that is non-empty, else **all of `flowYears()`**.
- ALL YEARS is `C.fys = null` (`flowAllYears`, 15357), so its selection is exactly the offered set.
- `flowToggleYear` (15343) starts from `flowSelYears()` and stores `null` when every offered year is on.

**Offered set, current board** (`flowYears`, 15451):

```
offered₀ = W ∪ R
  W = flowPlanYears() = {b, b+1, …, b+4},  b = MS.base || MS.cur                  (15446; NOT MS.cur, NOT MS.years)
  R = flowExecYears(null, true) = { f : some appropriation has ≥ 1 row FILED under f }   (15436, raw: no carryover)
```

**Offered set, proposed U1 board** (b4c55e38, one added line):

```
offered₁ = W ∪ R ∪ E
  E = flowExecYears(null) = { eff(r) : every workbook row r }, eff(r) = PS.to if the rule is on, r is filed in PS.from and
      its Budget cell (col 4) holds a token ('OBBBA, Mandatory'); else its filed year                    (flowEffFy, 15414)
```

**Money in ALL YEARS** (`flowCalc()`, 15528; the panel's total, and the export's, since `exportFlow` calls `flowCalc()`, 16660):

```
ALL = Σ_{appn a} Σ_{rows r of a, eff(r) ∈ offered} r.amount                                                   (15565)
    + Σ_{y ∈ offered, own appn has no row counted in y} lanes(MS.years[y])   (flowYearKind 15459 → flowPlanRecs 15499/15577;
                                                                               flowPlanHas 15489: no year state = no money)
    (+ partner/FMS type-ins C.other[y] for y ∈ offered, in F.grand: 15610/15614)
```

**Money in no offered year:**

- Own plan money in a year y with `MS.years[y]` ∉ offered. On both boards this is any year outside W ∪ R (or W ∪ R ∪ E) that the board holds a plan for: **U14**.
- On the current board only: rows whose counted year ∉ W ∪ R. **U1.**
- By code reading only, *not measured*: partner and FMS type-ins `C.other[y]` for y ∉ offered.

**Where the scope comes from (quoted, neutral):**

- **`flowPlanYears` (15443):** "The FYDP WINDOW, never the years that happen to carry state. A selector driven by MS.years omits every year nobody has typed into yet, which is most of the FYDP - the same defect rlgAllYears was built to fix, and it shows as nothing worse than a short list."
  - **Correction to the ledger's attribution:** this comment is **not R1's**. It has been in the file since the grid file's first commit, `2154832` (12 Sep), as has the ALL YEARS tooltip.
  - The comment rejects MS.years *as the driver* because it omits untyped window years.
  - `rlgAllYears()` (3997), which it cites, is `window ∪ MS.years ∪ {MS.cur}` ("anything outside it too").
- **R1 (`3aeda74`) on `flowYears`:** "the workbook's years, as before -- a saved year stays offered". On `flowExecYears`: "`raw`: the workbook's own years -- what the year buttons offer, so a saved FY25 selection stays FY25 when every FY25 row is counted as FY26."
  - Before R1, `flowYears = flowExecYears() ∪ flowPlanYears()`, with `flowExecYears()` the filed years: the same `W ∪ R`.
  - `main` (`f9b4413`, board `b160bc03`) has the same two-line `flowYears`. That is by code reading; main was **not measured** here.
- **The ALL YEARS chip (16424):** title "Every year this board can answer for — executed and planned together".
- **Help text (16652):** "**ALL YEARS** is the whole Sustainment portfolio; it adds separate appropriation years together…".
- **`flowSelYears` comment:** "Both default to everything, because the question this chart answers is 'where did the Sustainment portfolio go'".
- **`flowPlanRecs` (15502):** "A year nobody has planned holds no money."
- **The U1 line's own comment:** "so ALL YEARS holds every dollar".
- **Other surfaces handle years outside the window in different ways:**
  - The **🗓 menu** (25894–25900) lists them as "FYxx (outside window)" entries marked "has data".
  - The **FYDP report** (`fydpWindow`, 19063) uses window ∪ {MS.cur}. For a locked cycle it also adds the cycle's projected years.
  - **Realignment** (`rlgAllYears`) uses window ∪ every year with state ∪ {MS.cur}.
  - **PPBE** (20453–20457) says: "This position also carries figures in FYxx, outside the window. They are still counted in the Spruills."

**The carryover control.**

- Default: `flowPseudoDef()` (15391) is `{on:false, label:'OBBBA', token:'OBBBA, Mandatory', from:2025, to:2026, col:4}`.
- The chip is "+ OBBBA FY25". Its title is "OBBBA money is appropriated in FY2025 and spent as FY2026. Switched on, it counts as FY26 — never in both, whatever years are selected."
- **OFF:** a FY25 'Mandatory' row counts in FY25. With the U14 fixture, FY25 = 40 + 100 = 140 (cells 3 and 4).
- **ON:** it counts in FY26. On the current board at base 2027 it is then in no offered year (cells 9 and 10).

## (2) Candidate intended scopes, stated neutrally (no recommendation)

The offered-set formulas are exact. The "adds or excludes" column is **hand-derived** from the code and this fixture; none of these candidates (except S0 and S1) exists on any board, and none was built. The FY26 amounts it uses are the observed `flowCalc(2026)` figures in the matrix.

| | offered years = | precedent in the product | on this matrix, compared with S1 |
|---|---|---|---|
| **S0** (today, 4d273c06; pre-R1 and main by code reading) | W ∪ R (window ∪ years with rows filed) | R1's "as before" | Also excludes the carried 100 in cells 9 and 10 (U1). |
| **S1** (proposed U1, b4c55e38) | W ∪ R ∪ E (+ years a row is counted in) | U1 comment "holds every dollar" | Baseline. Still excludes the own FY26 plan 300 in cells 1, 3 and 7, and in X1. |
| **S2** | S1 ∪ H, with H = { y : `MS.years[y]` exists } (own year state) | `rlgAllYears`; the 🗓 menu's "(outside window)" entries | **Adds** FY26 in cells 1, 3 and 7: ALL YEARS becomes 840, 940 and 840 (+300). X1 also gets FY26 (+300). It **also offers a blank year**: the S4e state (FY26 reset to blank) gets an "FY26 · plan" chip over $0. It would also offer any older year the board holds state for, and read that year's own plan where the own appropriation has no row counted in it. |
| **S2$** | S1 ∪ { y ∈ H : the own plan's lane draw > 0 } | none found | Same as S2, but a blank or reset year is not offered. |
| **S3** | S1 ∪ { MS.cur } | `fydpWindow` (FYDP report) | Adds FY26 only while FY26 is the year being worked (X1: 640 → 940). Cells 1, 3 and 7 (cur 2027) still exclude the 300, so ALL YEARS would depend on which year is open. |
| **S4** | S1, unchanged | PPBE "outside the window. They are still counted" (there the money is counted *and* said) | Totals are as S1. The 300 outside the window would be *stated* rather than counted (cells 1, 3 and 7, and X1). |

**Selection is a separate axis from offering.** The broadening comes from `flowSelYears`' fallback (15334), not from the offered set.

- **S2** would keep S4b's and S4a's FY26 offered, because the FY26 plan exists there, so a saved [FY26] would stay FY26 (300).
- **S2 does not cover an FY26 selection that rests only on a counted row or the window.** One example is cell 10's carried 100 with the rule then switched off. Another is base 2026 → 2027 with no FY26 plan. Those would still fall back to ALL YEARS under S2.
- **S1, S3 and S4** leave every measured broadening as it is.

## (3) Control matrix (measured; literal expectations; M = $1,000,000, whole dollars)

**Fixture** (synthetic):

- **Board:** O&M (`mySlug()='om'`), one service USAF, one requirement F1. `MS.cur = 2027` in every cell.
- **Own plans:** FY27 pot 500. FY26 pot **300** or no FY26 year state.
- **Workbook, always present:** O&M filed FY2025 'USAF O&M Discretionary' 40.
- **Row variants:**
  - **none**
  - **carried:** Initial Spares filed FY2025 'USAF Spares Initial Mandatory PSM' 100. It counts in FY26 only with the rule ON.
  - **filed:** Initial Spares filed FY2026 'USAF Spares Initial PSM' 7. It counts in FY26 with the rule on or off.
- **Window:** base 2027 (FY27–FY31; FY26 outside) or base 2026 (FY26–FY30; FY26 inside).

**Column notes:**

- "ex" means executed and "pl" planned.
- "in no offered year" is the hand-written every-dollar total minus the measured ALL YEARS.
- ALL YEARS was checked equal on flowCalc, the panel ($M) and the export (TOTAL FUNDING, twice). The sum of the offered years taken one by one equals ALL YEARS in every cell, so nothing is double counted.

| # | base | rule | own FY26 plan | row counted in FY26? | workbook (filed) yrs | counted yrs | every $ on board | offered BEFORE | offered AFTER | ALL YEARS BEFORE | ALL YEARS AFTER | in no offered year BEFORE | AFTER | FY26 chip B / A | FY26 selected B / A | flowCalc(2026) direct |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2027 | OFF | 300 | none — no | 25 | 25 | 840 | 25 27 28 29 30 31 | 25 27 28 29 30 31 | 540 = 40 ex + 500 pl | 540 = 40 ex + 500 pl | **300** (own FY26 plan 300) | **300** (own FY26 plan 300) | none / none | cannot select / cannot select | 300 / 0 / 300 |
| 2 | 2027 | OFF | none | none — no | 25 | 25 | 540 | 25 27 28 29 30 31 | 25 27 28 29 30 31 | 540 = 40 ex + 500 pl | 540 = 40 ex + 500 pl | 0 | 0 | none / none | cannot select / cannot select | 0 / 0 / 0 |
| 3 | 2027 | OFF | 300 | carried IS 100 — no (counts FY25) | 25 | 25 | 940 | 25 27 28 29 30 31 | 25 27 28 29 30 31 | 640 = 140 ex + 500 pl | 640 = 140 ex + 500 pl | **300** (own FY26 plan 300) | **300** (own FY26 plan 300) | none / none | cannot select / cannot select | 300 / 0 / 300 |
| 4 | 2027 | OFF | none | carried IS 100 — no (counts FY25) | 25 | 25 | 640 | 25 27 28 29 30 31 | 25 27 28 29 30 31 | 640 = 140 ex + 500 pl | 640 = 140 ex + 500 pl | 0 | 0 | none / none | cannot select / cannot select | 0 / 0 / 0 |
| 5 | 2027 | OFF | 300 | filed IS FY26 7 — yes | 25 26 | 25 26 | 847 | 25 26 27 28 29 30 31 | 25 26 27 28 29 30 31 | 847 = 47 ex + 800 pl | 847 = 47 ex + 800 pl | 0 | 0 | FY26 · plan (T1) / same | 307 (7 ex + 300 pl) / same | 307 / 7 / 300 |
| 6 | 2027 | OFF | none | filed IS FY26 7 — yes | 25 26 | 25 26 | 547 | 25 26 27 28 29 30 31 | 25 26 27 28 29 30 31 | 547 = 47 ex + 500 pl | 547 = 47 ex + 500 pl | 0 | 0 | FY26 · plan (T1) / same | 7 (7 ex + 0 pl) / same | 7 / 7 / 0 |
| 7 | 2027 | ON | 300 | none — no | 25 | 25 | 840 | 25 27 28 29 30 31 | 25 27 28 29 30 31 | 540 = 40 ex + 500 pl | 540 = 40 ex + 500 pl | **300** (own FY26 plan 300) | **300** (own FY26 plan 300) | none / none | cannot select / cannot select | 300 / 0 / 300 |
| 8 | 2027 | ON | none | none — no | 25 | 25 | 540 | 25 27 28 29 30 31 | 25 27 28 29 30 31 | 540 = 40 ex + 500 pl | 540 = 40 ex + 500 pl | 0 | 0 | none / none | cannot select / cannot select | 0 / 0 / 0 |
| 9 | 2027 | ON | 300 | carried IS 100 — yes | 25 | 25 26 | 940 | 25 27 28 29 30 31 | **25 26** 27 28 29 30 31 | 540 = 40 ex + 500 pl | **940 = 140 ex + 800 pl** | **400** (own FY26 plan 300 + carried IS 100) | 0 | none / FY26 · plan (T1) | cannot select / 400 (100 ex + 300 pl) | 400 / 100 / 300 |
| 10 | 2027 | ON | none | carried IS 100 — yes | 25 | 25 26 | 640 | 25 27 28 29 30 31 | **25 26** 27 28 29 30 31 | 540 = 40 ex + 500 pl | **640 = 140 ex + 500 pl** | **100** (carried IS 100) | 0 | none / FY26 · plan (T1) | cannot select / 100 (100 ex + 0 pl) | 100 / 100 / 0 |
| 11 | 2027 | ON | 300 | filed IS FY26 7 — yes | 25 26 | 25 26 | 847 | 25 26 27 28 29 30 31 | 25 26 27 28 29 30 31 | 847 = 47 ex + 800 pl | 847 = 47 ex + 800 pl | 0 | 0 | FY26 · plan (T1) / same | 307 (7 ex + 300 pl) / same | 307 / 7 / 300 |
| 12 | 2027 | ON | none | filed IS FY26 7 — yes | 25 26 | 25 26 | 547 | 25 26 27 28 29 30 31 | 25 26 27 28 29 30 31 | 547 = 47 ex + 500 pl | 547 = 47 ex + 500 pl | 0 | 0 | FY26 · plan (T1) / same | 7 (7 ex + 0 pl) / same | 7 / 7 / 0 |
| 13 | 2026 | OFF | 300 | none — no | 25 | 25 | 840 | 25 26 27 28 29 30 | 25 26 27 28 29 30 | 840 = 40 ex + 800 pl | 840 = 40 ex + 800 pl | 0 | 0 | FY26 · plan (T0) / same | 300 (0 ex + 300 pl) / same | 300 / 0 / 300 |
| 14 | 2026 | OFF | none | none — no | 25 | 25 | 540 | 25 26 27 28 29 30 | 25 26 27 28 29 30 | 540 = 40 ex + 500 pl | 540 = 40 ex + 500 pl | 0 | 0 | FY26 · plan (T0) / same | 0 / same | 0 / 0 / 0 |
| 15 | 2026 | OFF | 300 | carried IS 100 — no (counts FY25) | 25 | 25 | 940 | 25 26 27 28 29 30 | 25 26 27 28 29 30 | 940 = 140 ex + 800 pl | 940 = 140 ex + 800 pl | 0 | 0 | FY26 · plan (T0) / same | 300 (0 ex + 300 pl) / same | 300 / 0 / 300 |
| 16 | 2026 | OFF | none | carried IS 100 — no (counts FY25) | 25 | 25 | 640 | 25 26 27 28 29 30 | 25 26 27 28 29 30 | 640 = 140 ex + 500 pl | 640 = 140 ex + 500 pl | 0 | 0 | FY26 · plan (T0) / same | 0 / same | 0 / 0 / 0 |
| 17 | 2026 | OFF | 300 | filed IS FY26 7 — yes | 25 26 | 25 26 | 847 | 25 26 27 28 29 30 | 25 26 27 28 29 30 | 847 = 47 ex + 800 pl | 847 = 47 ex + 800 pl | 0 | 0 | FY26 · plan (T1) / same | 307 (7 ex + 300 pl) / same | 307 / 7 / 300 |
| 18 | 2026 | OFF | none | filed IS FY26 7 — yes | 25 26 | 25 26 | 547 | 25 26 27 28 29 30 | 25 26 27 28 29 30 | 547 = 47 ex + 500 pl | 547 = 47 ex + 500 pl | 0 | 0 | FY26 · plan (T1) / same | 7 (7 ex + 0 pl) / same | 7 / 7 / 0 |
| 19 | 2026 | ON | 300 | none — no | 25 | 25 | 840 | 25 26 27 28 29 30 | 25 26 27 28 29 30 | 840 = 40 ex + 800 pl | 840 = 40 ex + 800 pl | 0 | 0 | FY26 · plan (T0) / same | 300 (0 ex + 300 pl) / same | 300 / 0 / 300 |
| 20 | 2026 | ON | none | none — no | 25 | 25 | 540 | 25 26 27 28 29 30 | 25 26 27 28 29 30 | 540 = 40 ex + 500 pl | 540 = 40 ex + 500 pl | 0 | 0 | FY26 · plan (T0) / same | 0 / same | 0 / 0 / 0 |
| 21 | 2026 | ON | 300 | carried IS 100 — yes | 25 | 25 26 | 940 | 25 26 27 28 29 30 | 25 26 27 28 29 30 | 940 = 140 ex + 800 pl | 940 = 140 ex + 800 pl | 0 | 0 | FY26 · plan (T1) / same | 400 (100 ex + 300 pl) / same | 400 / 100 / 300 |
| 22 | 2026 | ON | none | carried IS 100 — yes | 25 | 25 26 | 640 | 25 26 27 28 29 30 | 25 26 27 28 29 30 | 640 = 140 ex + 500 pl | 640 = 140 ex + 500 pl | 0 | 0 | FY26 · plan (T1) / same | 100 (100 ex + 0 pl) / same | 100 / 100 / 0 |
| 23 | 2026 | ON | 300 | filed IS FY26 7 — yes | 25 26 | 25 26 | 847 | 25 26 27 28 29 30 | 25 26 27 28 29 30 | 847 = 47 ex + 800 pl | 847 = 47 ex + 800 pl | 0 | 0 | FY26 · plan (T1) / same | 307 (7 ex + 300 pl) / same | 307 / 7 / 300 |
| 24 | 2026 | ON | none | filed IS FY26 7 — yes | 25 26 | 25 26 | 547 | 25 26 27 28 29 30 | 25 26 27 28 29 30 | 547 = 47 ex + 500 pl | 547 = 47 ex + 500 pl | 0 | 0 | FY26 · plan (T1) / same | 7 (7 ex + 0 pl) / same | 7 / 7 / 0 |

**FY26 chip, when offered.**

- **Text:** `FY26 · plan` (O&M has no FY26 execution in any variant).
- **Tooltips:**
  - **T0** = "FY2026 has no O&M execution imported, so O&M is answered from this board’s own allocation".
  - **T1** = T0 + "; other appropriations’ execution for it is read from their import". T1 appears when another appropriation has a row counted in FY26.
- **Plan absent:** in cells 14, 16, 20 and 22 (no FY26 plan) the chip still reads "answered from this board's own allocation" over $0. This wording is older than U1 (the u1demo verifier, issue 4).

**Labels, measured.** These are the same on panel and export Scope:

- **ALL YEARS, cells 1 and 3 (both boards) and cell 9 (before):** "FY25–FY31 · all years · all appropriations · FY27, FY28, FY29, FY30, FY31 planned, the rest executed". Panel text mentions of FY26: 0.
- **ALL YEARS, cell 9 (after):** "FY25–FY31 · all years · all appropriations · FY26: O&M planned, INITIAL SPARES executed, FULL FUND, OPN not in this total · FY27, FY28, FY29, FY30, FY31 planned".
- **FY26 selected:**
  - Cells 13 and 15: "FY26 · all appropriations · PLANNED (board allocation, O&M)".
  - Cells 9 (after) and 21: "FY26 · all appropriations · FY26: O&M planned, INITIAL SPARES executed, FULL FUND, OPN not in this total · + OBBBA FY25".
  - Cell 5: the same without "+ OBBBA FY25".

**🗓 menu, cells 1, 3 and 9 (both boards):** an "FY26 (outside window)" entry marked "has data" (textContent `FY26 (outside window)has data`).

**X1 (U14 fixture, both boards).** The user switches to the existing FY26 (no prompt), so `MS.cur` is 2026 with base 2027.

- Offered: FY25, FY27–FY31.
- ALL YEARS: 640. `flowCalc(2026)` = 300.
- For comparison: `fydpWindow()` = [2026–2031] and `rlgAllYears()` = [2026–2031].

## (4) Explicit selections: chosen by clicking the panel's own buttons, saved, reopened (`boot(buildSavedHtml())`)

"stored" is the saved `MS.flow.fys`; "selection" is `flowSelYears()`. Every row is measured, with the literal expectation passing.

| # | fixture | action | BEFORE (4d273c06) | AFTER (b4c55e38) | broadened / narrowed? |
|---|---|---|---|---|---|
| S1 | U14: base 2027, rule OFF, plan 300, carried row | "only" on FY25, save, reopen | stored [2025], selection [2025], **140** (40 + 100), $140.00M, only FY25 on | same | preserved |
| S1b | the same, rule ON | the same | [2025], **40** | [2025], **40** | preserved |
| S2 | U14 | FY25 "only", then toggle FY27, save, reopen | stored and selection [2025, 2027], **640** (140 ex + 500 pl), ALL YEARS off | same | preserved (here 640 also equals ALL YEARS, so the selection list is the test) |
| S2f | base 2027, OFF, plan, filed FY26 7 | the same | [2025, 2027], **540** (ALL YEARS is 847) | same | preserved |
| S3a | U14 | try FY26 | **no FY26 chip and no "only" button**: cannot be selected | same | not reachable |
| S3b | U14 with rule ON | FY26 "only", save, reopen | **not offered**: cannot be selected | [2026], **400** (100 ex + 300 pl), preserved | preserved where reachable |
| S3c | U14 at base 2026 | FY26 "only", save, reopen | [2026], **300** (0 ex + 300 pl) | same | preserved |
| S3d | base 2027, OFF, plan, filed FY26 7 | FY26 "only", save, reopen | [2026], **307** (7 ex + 300 pl) | same | preserved |
| S4a | U14 with rule ON | FY26 "only" (400); then the rule chip OFF; save, reopen; then the rule chip ON | not reachable (FY26 never offered here) | After rule OFF: offered FY25, FY27–31; **stored [2026], selection = ALL YEARS, 640**. ALL YEARS chip on, no chip for FY26, panel mentions FY26 0 times; the same on the reopened copy, whose export reads TOTAL FUNDING 640 ×2 and Scope "FY25–FY31 · all years · …". Rule ON again: **[2026], 400** again. | **silently broadened** (after board) |
| S4b | U14 at base 2026 | FY26 "only" (300); then Set base year 2027; save, reopen; then toggle FY27 | After the base move: **stored [2026], selection = ALL YEARS [2025, 2027–2031], 640**, ALL YEARS chip on, no mention of FY26. Export 640 ×2, Scope "FY25–FY31 · all years …". Same reopened. FY27 toggle: stored [2025, 2028, 2029, 2030, 2031], 140, so the [2026] is gone. | same | **silently broadened** (both boards) |
| S4c | U14 at base 2026 | FY25 "only" + toggle FY26 (440 = 140 + 300); then Set base year 2027; save, reopen | **stored [2025, 2026], selection [2025], 140**; label "FY25 · all appropriations" | same | **silently narrowed** (both) |
| S4d | U14 at base 2026 | FY26 "only" (300); then switchYear 2026, 🗑 Reset FY26 to blank (one confirm), switchYear 2027; save, reopen | FY26 still offered (window), [2026], **0**, $0.00M | same | preserved |
| S4e | U14 (base 2027) | Reset FY26 to blank | offered FY25, FY27–31 before and after the reset; ALL YEARS 640 after it (640 before it too: cell 3) | same | offering does not depend on the plan |

## Sensitivity (can these checks fail?)

**Cross-runs.** Each board was judged by the other board's literal column.

- Exactly the cells where the boards differ fail: 9 and 10 (offer, ALL YEARS ×3, panel, FY26 chip, export, FY26 selection), S3b and S4a.
- That is 22 failures on before and 18 on after. Every other check passes on both.
- So the matrix checks distinguish U1's change, and both boards behave identically everywhere else.

**The U14 cells (1, 3 and 7) behave the same on both boards**, so the cross-run cannot test them. Their sensitivity rests on positive controls in the same run:

- The same $300M is counted wherever FY26 is offered: in ALL YEARS (840 or 940 in cells 13, 15, 19 and 21, and 847 in 5, 11, 17 and 23) and in the FY26 selections.
- `flowCalc(2026)` asked directly returns 300 in cells 1, 3 and 7, so the reader does see the money.
- An ALL YEARS literal of 540 or 640 cannot pass if the 300 were included.

No mutant was built for U14, because the only meaningful mutant would be a candidate correction (S2), which this task excludes.

## Caveats and shortcuts (said plainly)

**State-level setup (not a product path):**

- The workbook is seeded into `EXDB.all` (32-column rows), as carry-probe and u1demo did, and not imported through the QPE importer.
- The initial board (base 2027, cur 2027, FY27 pot 500, `MS.years={2027:S}`, ALL YEARS selected, no `MS.flow.pseudo`) is set through state after `seed()`, as u1demo did.

**Product paths used:**

- **Base year:** `setBaseYear()` (the 🗓 menu's "⚙ Set base year…") with `window.prompt` answered.
- **FY26 plan:** `switchYear(2026)` answered Cancel (blank), then `restoreReq('F1')`, `bmSetBase('disc',0,'300000000')` and `switchYear(2027)`. Confirm was asked once, "FY26 has no data yet".
- **Rule:**
  - In the matrix build: `flowSetPseudo('on', true)`, the rule chip's own handler, called directly.
  - In S4a: the rule chip was **clicked**, both off and back on.
- **Selections:** clicked on the rendered panel buttons (`only`, the FY toggles, ALL YEARS).
- **Plan removal:** `resetYear()` (confirm OK).
- **Reopen:** `boot({html: buildSavedHtml()})`.

**Scope of the evidence:**

- jsdom only, through boot.mjs stubs and the shim; not a real browser.
- One scale only (×$1M, so the panel's $M figures are checkable). Integer scale was shown equivalent in u1demo; it was not re-run here.
- The export was read for ALL YEARS in every cell and in the S4a and S4b fallbacks. It was not read for the FY26 selections.
- Not measured: `main`; partner and FMS type-ins in a year that is not offered (by code reading they leave `F.grand` the same way); a locked-cycle view.
- `window.confirm` answered OK during the reads (the roll-forward answer, the worst case) and was counted: 0 calls in every matrix cell.
- No jsdom errors in any matrix cell or in the S1 reopened copy (the checks look only there). `EXDB.all` was byte-identical to the fixture after every matrix cell's reads.

**Candidate scopes:** S2–S4 are described from the code and are not measured, since no such board exists.

## Files

- `README.md`: this file.
- `u14-probe.mjs` (v2, final) and `u14-probe-v1.mjs` (superseded).
- `run.sh`, `summarize.mjs`, `gen-tables.mjs`.
- `out/before-2.json` and `out/after-2.json` (final); `out/*-1.json` (v1); `out/xsens-*.json` (sensitivity).
- `logs/*.log` and `logs/runs.txt`; `pids.txt`.
- `boards/before` and `boards/after` (the copies booted).
