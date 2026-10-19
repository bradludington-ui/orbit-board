# U1: the proposed correction, built on a disposable copy and measured (11 Oct 2026, runs 7:22–7:29 PM ET)

Brad, 7:17 PM ET: "Show the exact proposed U1 diff and its effect on year availability, totals and selection. Include
independent screen/export arithmetic and a control proving a saved FY25-only selection stays FY25-only after reopening.
Conditional wording alone leaves the omitted-money finding open."

**What this is.** These are **draft checks**, run on a disposable `git archive` copy of `d1ee751`.
- **The base:** `d1ee751` has the same board, tools and package.json as `4a6f7c7`, the current head product. Its board
  blob is `4d273c06…`.
- **Not touched:** the repository's board and tools. Nothing is committed to the product.
- **Not yet done:** integrated validation at a real commit, and committed-suite sensitivity. Both wait for Brad's
  decision.
- **Provenance:** blobs and checksums are in `provenance.txt`. Runs used Node v22.22.0 and jsdom 27.4.0, with BOARD
  unset. Each run was bounded (600 s cap) in its own process group, with its PIDs in `logs/pids.txt`. Runs went one at
  a time, beside the audit-import sensitivity driver; no full suite was run.

## 1. The exact proposed diff

**Board** (`board.diff`). One added line and a comment update. Board `4d273c06…` becomes `b4c55e38…`.

```diff
@@ -15429,8 +15429,9 @@
 // v2.00 (R1): BY EFFECTIVE YEAR (flowEffFy), the year flowCalc counts each row in. By the workbook's year, O&M's FY25 OBBBA
 // rows counted as FY26 left FY26 "planned", so its whole plan was read as well ($100M carried + $500M plan = $600M), and FY25
-// was "executed" with nothing left in it. `raw`: the workbook's own years -- what the year buttons offer, so a saved FY25
-// selection stays FY25 when every FY25 row is counted as FY26. A year's rows land in it or in PS.to, so once both are
+// was "executed" with nothing left in it. `raw`: the workbook's own years -- the year buttons offer these, so a saved FY25
+// selection stays FY25 when every FY25 row is counted as FY26, and (v2.00, U1) every year a row is counted in, and the plan
+// window. A year's rows land in it or in PS.to, so once both are
 // marked the rest of that year is not read (the panel asks this per year and appropriation); newest year first, so PS.to's
@@ -15451,6 +15452,7 @@
 function flowYears(){
   const y={};
   flowExecYears(null, true).forEach(f=>y[f]=1);   // v2.00 (R1): the workbook's years, as before -- a saved year stays offered
+  flowExecYears(null).forEach(f=>y[f]=1);         // v2.00 (U1): and every year a row is COUNTED in, so ALL YEARS holds every dollar
   flowPlanYears().forEach(f=>y[f]=1);
   return Object.keys(y).map(Number).sort((a,b)=>a-b);
 }
```

**The rest of the proposed commit (drafted here, not applied):**
- **Test** (`block.mjs.txt`): an audit-recon block, inserted after `// ==== end v2.00 (R1, Brad's decisions of 11 Oct) ====`
  and before `_selfRead`. It has a two-space `const name` line, so the scenario-ran guard sees it. It has 28 checks:
  - 15 defect checks;
  - 13 controls, including three reopen controls and the raw-history guard.
- **Mutations** (`mutations.mjs.txt`):
  - `v200-u1-year-unoffered` removes the new line.
  - `v200-u1-own-appn-only` lets only the board's own appropriation open a year.
- **NEXT-VERSION entry** (proposed text):
  > **U1 (Brad, 11 Oct).** A row the carryover rule counts in a year that is neither a workbook year nor in the plan window
  > is now counted. The year buttons offer every year a row is counted in, beside the workbook's years and the window, so
  > ALL YEARS, the panel and the export hold every carried dollar. Example: FY25 OBBBA rows counted as FY26 when FY26 is
  > neither imported nor planned. On the synthetic fixture, ALL YEARS was $540,000,000 of $660,000,000, with the $120,000,000
  > carried in no year and a saved FY26 selection silently shown as all years. A selection saved for FY25 alone stays FY25
  > alone after reopening. Predates R1.
- **No other product line changes.** `flowCalc`, `flowSelYears`, the panel and the export are untouched. They already
  count by effective year and draw from `flowYears()`.

## 2. Effect on year availability, totals and selection

Expected figures are literal sums of the fixture amounts, written by hand in the probes. No ORBIT helper computes an
expectation. "Before" is board `4d273c06`; "after" is `b4c55e38`.

**Fixture A.**
- **Board:** O&M, window FY27–FY31. The FY27 plan is USAF $350M + ANG $150M.
- **FY25 rows:**
  - O&M ordinary, $40M;
  - O&M OBBBA, $100M, counted in FY26;
  - Initial Spares Mandatory, $20M, counted in FY26.
- **Variants:** A2 has only the carried rows. A3 has only Spares carrying.
- **Controls:** C(ii) moves the window to start at FY26. C(iii) adds an O&M FY26 row. C(iii-b) adds a Full Fund FY26
  row. C(iv) switches the rule off.

| Case · scope | Years offered (before → after) | Selection (before → after) | Total, before → after | Literal | Executed / planned after | Export TOTAL FUNDING after |
|---|---|---|---|---|---|---|
| A · ALL YEARS | FY25, FY27–31 → **FY25, FY26, FY27–31** | all → all (now with FY26) | 540,000,000 → **660,000,000** | 40+100+20+350+150 = 660,000,000 | 160,000,000 / 500,000,000 | 660,000,000 ×2 |
| A · ALL × O&M | same | same | 540,000,000 → **640,000,000** | 40+100+350+150 = 640,000,000 | 140,000,000 / 500,000,000 | 640,000,000 ×2 |
| A · FY26 chosen | same | **all years (silently) → FY26** | 540,000,000 → **120,000,000** | 100+20 = 120,000,000 | 120,000,000 / 0 | 120,000,000 ×2, with the OBBBA NOTE |
| A · FY25 chosen (control) | same | FY25 → FY25 | 40,000,000 → 40,000,000 | 40,000,000 | 40,000,000 / 0 | 40,000,000 ×2 |
| A2 · ALL YEARS | FY25, FY27–31 → FY25, FY26, FY27–31 | all → all | 500,000,000 → **620,000,000** | 100+20+350+150 = 620,000,000 | 120,000,000 / 500,000,000 | 620,000,000 ×2 |
| A3 · ALL YEARS | same | all → all | 540,000,000 → **560,000,000** | 40+20+350+150 = 560,000,000 | 60,000,000 / 500,000,000 | 560,000,000 ×2 |
| C(ii), C(iii), C(iii-b) | FY26 already offered: unchanged | unchanged | 660 / 667 / 663 M: unchanged | as left | unchanged | unchanged |
| C(iv), rule off | FY25, FY27–31: **unchanged** (nothing counts in FY26) | unchanged | 660,000,000; FY25 alone 160,000,000: unchanged | as left | unchanged | unchanged |

**On screen and in the file.** For each case: the panel's "total funding", `flowCalc`, export TOTAL FUNDING (summary and
reconciliation), US SERVICE FUNDING, US service appropriations, and every appropriation line equal the literal sum.
- **Fixture A after the fix:**

  | Line | Amount |
  |---|---|
  | O&M | 640,000,000 |
  | INITIAL SPARES | 20,000,000 |
  | FULL FUND | 0 |
  | OPN | 0 |

  The export's "Fiscal years included" lists FY2026. The planned-and-executed box and its NOTE gain the line "FY26: O&M,
  INITIAL SPARES executed".
- **Ownership:** each carried row appears once, in FY26, on its own appropriation, service, office and amount. That holds
  in `flowCalc` and in the export detail.
- **Year by year:** the offered years taken one at a time add up to ALL YEARS:
  40,000,000 + 120,000,000 + 500,000,000 + 0 + 0 + 0 + 0 = 660,000,000.
- **Chips:** the FY26 chip reads "FY26" (it is executed) with the tooltip "FY2026 is answered from the imported CCaR QPE".
  In A3 it reads "FY26 · plan".
- **R1b wording:** the FY25 tooltip ("…stored under FY2025 and counted in FY2026 (OBBBA)…") and the planned-year note
  become true, because FY26 is now offered and in the total. Without the fix that wording is untrue in A2.

## 3. Saved and reopened (`buildSavedHtml`, then a fresh board from those bytes)

| Saved selection | Reopened: saved / selection | Total | Chips on | Export |
|---|---|---|---|---|
| **FY25 alone**, fixture A (FY25 has its own $40M row) | `[2025]` / `[2025]` | 40,000,000 executed; the carried rows are not in it | `FY25` only | `Scope: FY25 · all appropriations`, TOTAL FUNDING 40,000,000 ×2, no carried row |
| **FY25 alone**, A2P (every FY25 row carried, FY25 plan USAF $30M + ANG $15M) | `[2025]` / `[2025]` | 45,000,000 planned (30+15); the carried rows are not in it | `FY25 · plan` only | `Scope: FY25 · all appropriations · PLANNED (board allocation, O&M)`, 45,000,000 ×2 |
| FY25 + FY27 (a list saved before FY26 was offered) | `[2025, 2027]` / `[2025, 2027]`: FY26 is not added | 40 + 500 = 540,000,000 | `FY25`, `FY27 · plan` | – |
| FY26 alone | `[2026]` / `[2026]`, never all years | 100 + 20 = 120,000,000 | – | `Scope: FY26 · all appropriations · + OBBBA FY25`, 120,000,000 ×2, INITIAL SPARES 20,000,000, OBBBA NOTE with 120000000 |

- **Before and after the fix:** the FY25-only and FY25 + FY27 controls **pass on both boards**. The fix does not widen,
  narrow or shift a saved selection.
- **Under the R1 mutation `v200-r1-saved-year-widens`:** the A2P FY25-only reopen control fails. The selection becomes
  all years, so this control is sensitive.
- **Raw execution:** `EXDB.all` is exactly as imported, in the board and in every reopened copy.

## 4. Results (`logs/`, `results/`)

| Run | Board | Result |
|---|---|---|
| `carry-probe.mjs` (unchanged, sha256 `8ab2131b…`) | before | 166 passed, 72 failed: all defect checks; 0 control or fixture failures. As recorded at 4a6f7c7 |
| same | **after** | **238 passed, 0 failed**: defect 72, control 145, fixture 21 |
| the verifier's independent `verify-probe.mjs` (unchanged, `e1148aba…`; another rule, amounts and appropriations) | before | defect 0/57; control 80/80; fixture 13/13; edge 14/42 |
| same | **after** | **defect 57/57, control 80/80, fixture 13/13, edge 42/42**, including its V4 layout |
| focused harness: audit-recon's R1 and R1b blocks verbatim, plus the U1 block (`focused-u1.mjs`) | before | 15 failing, all in the U1 block's defect checks. R1, R1b and every U1 control pass |
| same | **after** | **ALL CHECKS PASSED** |

The first `focused-before` run had a harness error. `offered()` returned a JSON string, so C(iv) and the year-availability
check compared a string with an array. Its log was overwritten by the corrected run; both runs are listed in
`logs/runs.txt`. The fix was in the harness only, and the board figures were unchanged.

**Mutation sensitivity of the draft block (draft level, on mutants of the patched board).** Each mutant applies once.

| Mutation | Caught | By |
|---|---|---|
| `v200-u1-year-unoffered` (new) | 15 failing | every U1 defect check |
| `v200-u1-own-appn-only` (new) | 1 failing | A3 |
| `v200-r1-scan-stops-early` (existing) | 15 failing | R1, R1b, and U1 A and **V4**: the money-level guard the verifier asked for |
| `v200-r1-saved-year-widens` (existing) | 20 failing | R1, R1b, and U1 A2, A2P and the **A2P FY25-only reopen control** |
| `v200-r1-raw-year-exec` (existing) | 45 failing | R1, R1b and U1 |

**Applicability.** On the patched board, all 1,305 existing catalog entries match exactly once. With the two drafts the
count is 1,307 entries, all once. On the current board the two drafts do not match, as expected.

## 5. The one edge that needs Brad's decision (`edge-probe.mjs`, measured)

The board still holds an O&M FY26 plan (USAF $70M + ANG $30M), FY26 is outside the window, and no row is filed under it.

| Case | Before | After | Literal readings |
|---|---|---|---|
| **E3:** only Initial Spares carries into FY26; O&M counts nothing there | ALL 540,000,000 | **ALL 660,000,000**. FY26 = 120,000,000: Spares 20,000,000 executed + O&M plan 100,000,000 | Existing per-year rule (a year with no O&M execution reads O&M's plan): 40+20+70+30+350+150 = 660,000,000. Carried rows only: 560,000,000 |
| **E1:** O&M carries too | ALL 540,000,000 | **ALL 660,000,000**. FY26 = 120,000,000 executed; the FY26 plan is never read | Execution wins: 40+100+20+350+150 = 660,000,000 |

With the fix, E3 reads O&M's own FY26 plan, because another appropriation's carried row opens the year. That is the
existing rule applied to every offered year. FY25 already works this way today, and the verifier's VE3 shows it does when a
row makes the year a workbook year. But it is money beyond the carried rows.

**Decision for Brad:** read that plan (the existing rule), or count only the carried rows in such a year? The second needs
a further change in `flowCalc` and is not built.

## 6. Observed, not part of U1

The OBBBA NOTE says "(2 plan events)" of two executed rows: "includes 120000000 of OBBBA … counted here as FY2026 (2 plan
events)". This is existing wording, and the same on the current board in C(ii). It can be added to U8's wording items.
