# CARRY-1: proposed correction (not built)

This is separate from R1 and R1b. Evidence: `README.md` and `results-*.json` in this folder. Nothing here has been applied or
run against a patched board. Every "after" value below is **predicted from reading the code**. Each must be confirmed when the
change is built.

## The defect

The year buttons come from `flowYears()`, which is the workbook's own years plus the plan window. `flowCalc()` counts each row in
its **effective** year (`flowEffFy`). Under the carryover rule, a row's effective year can be one that `flowYears()` does not
contain: FY25 OBBBA → FY26, when no appropriation files a row under FY26 and FY26 is outside `MS.base..MS.base+4`. That row is
then counted in no offered year:

- ALL YEARS leaves it out.
- An explicit selection of its year is filtered away and silently becomes ALL YEARS.
- The panel and the export agree on the short total and say nothing.

Fixture A shows 540,000,000 where every dollar is 660,000,000. It reproduces on 46b28b5, on the R1b draft, on the committed R1
follow-up 4a6f7c7, and on main f9b4413.

## Recommended correction: offer every year a row is counted in

One added line in `flowYears()`. Nothing else in the product changes.

```diff
 function flowYears(){
   const y={};
   flowExecYears(null, true).forEach(f=>y[f]=1);   // v2.00 (R1): the workbook's years, as before -- a saved year stays offered
+  flowExecYears(null).forEach(f=>y[f]=1);         // CARRY-1: and every year a row is COUNTED in, so ALL YEARS holds every dollar
   flowPlanYears().forEach(f=>y[f]=1);
   return Object.keys(y).map(Number).sort((a,b)=>a-b);
 }
```

Also update the R1 comment above `flowExecYears`. "`raw`: the workbook's own years -- what the year buttons offer" becomes:
"the year buttons offer these, every effective year (CARRY-1), and the plan window". Add a NEXT-VERSION entry.

**Why it is enough.**

- `flowExecYears(null)` is the effective-year scan that `flowCalc` already relies on: per appropriation, newest year first, each
  row mapped by `flowEffFy`.
- A row filed under `PS.from` can only land in `PS.from` or `PS.to`. The scan keeps reading that year's rows until both are
  marked.
- Every other year's rows land in their own year, which the raw scan already offers.
- So the union is every year `flowCalc` can count a row in. The invariant becomes: **for every row r, `flowEffFy(r)` is in
  `flowYears()`**. ALL YEARS is then every row plus the plan.
- Offering an extra year cannot double-count, because `flowCalc` still counts each row once, by its effective year.
- Execution still wins over plan per appropriation and year. `flowYearKind` is unchanged.

**Exact locations.**

| Board | Blob | `flowYears()` | Insert after | Comment to update |
|---|---|---|---|---|
| 46b28b5 (and HEAD 2b5b02b) | `82c7f446…` | L15451–15456 | L15453 | L15432–15435 |
| R1b on 46b28b5 (the then-staged blob) | `5b2c5856…` | L15451 | L15453 | – |
| **R1 follow-up as committed, 4a6f7c7** (HEAD fa46783) | `4d273c06…` | **L15451–15456** | **L15453** | L15432–15435 |
| R1b draft (wt, on e635775) | `2365dacae…` | L15442 | L15444 | – |

Unchanged code whose behaviour follows from the new line (46b28b5 line numbers; at 4a6f7c7 the `flowCalc` filter is L15565,
`flowHtml` L16402, the OBBBA chip L16440, `exportFlow` L16656 and its OBBBA NOTE L16680):

- `flowSelYears` L15331–15335: the filter at L15333 no longer drops a saved FY26.
- `flowCalc` L15521: the effective-year filter at L15558.
- `flowHtml` L16395: chips from `flowYears()` at L16396. The OBBBA chip and its tooltip at L16425–16430 become true.
- `exportFlow` L16636.

**Predicted after the change** (fixture as in README):

| Case · scope | Today (observed) | After (predicted) | Literal |
|---|---|---|---|
| A · year chips | FY25, FY27–FY31 | FY25, **FY26**, FY27–FY31 ("FY26" unmarked: O&M execution is counted in it) | – |
| A · ALL × all appns | 540,000,000 (exec 40,000,000) | 660,000,000 (exec 160,000,000, plan 500,000,000) | 660,000,000 |
| A · ALL × O&M | 540,000,000 | 640,000,000 | 640,000,000 |
| A · FY26 explicit | ALL YEARS, 540,000,000 | FY26, 120,000,000, "FY26 · all appropriations · + OBBBA FY25", export NOTE "includes 120000000 of OBBBA … counted here as FY2026 (2 plan events)" | 120,000,000 |
| A2 · ALL | 500,000,000 (exec 0) | 620,000,000 (exec 120,000,000) | 620,000,000 |
| A3 · ALL | 540,000,000 | 560,000,000. "FY26 · plan": O&M has nothing counted in FY26; Initial Spares' execution is read | 560,000,000 |
| C(ii), C(iii), C(iii-b), C(iv) | correct | unchanged (no year added) | as today |

## The test it needs: a committed audit-recon block

Add a block after `// ==== end v2.00 (R1) ====`, in the house style: `w5Chk`, `w6Book`, one fresh board per variant,
`bootMark`/`bootRelease`/`settleBoards`.

**Fixture**, literal and the same as this probe's:

- Services USAF and ANG; `it('F1','PSM',[350000000,150000000])`, disc `[350000000,150000000]`, mand `[0,0]`.
- `MS.base=2027; MS.cur=2027; FYMON=fyMonths(2027); MS.years={2027:S}`.
- Rule `{on:true, label:'OBBBA', token:'OBBBA, Mandatory', from:2025, to:2026, col:4}`.
- O&M FY25 rows: **ordinary first**, then carried: ANG O&M Discretionary 40,000,000 TSS; USAF O&M OBBBA 100,000,000 PSM.
- Initial Spares FY25: USAF Spares Initial Mandatory PSM 20,000,000 ATL.

Block header comment: "FAILS ON 46b28b5 and on the R1 follow-up draft, except the CONTROLs: FY26 was not offered, so ALL
YEARS was 540,000,000 and the 120,000,000 carried was in no year, on screen or in the export."

| # | Check (what it says) | Expected (literal) | 46b28b5 / R1b today |
|---|---|---|---|
| 1 | CONTROL: fixture: board O&M, plan from FY27, FY27 plan USAF 350,000,000 + ANG 150,000,000 | `om\|2027\|2027\|350000000\|150000000` | pass |
| 2 | A · year chips: FY26 offered beside FY25 and the window | `['FY25','FY26','FY27 · plan','FY28 · plan','FY29 · plan','FY30 · plan','FY31 · plan']` | fail (no FY26) |
| 3 | A · ALL YEARS × all appropriations | total 40,000,000 + 100,000,000 + 20,000,000 + 350,000,000 + 150,000,000 = 660,000,000; executed 160,000,000; planned 500,000,000 | fail (540,000,000; 40,000,000) |
| 4 | A · ALL YEARS · panel | "total funding $660.00M"; "$160.00M executed" and "$500.00M planned" | fail |
| 5 | A · ALL YEARS · export | TOTAL FUNDING `[660000000,660000000]`; US SERVICE FUNDING `[660000000]`; US service appropriations `[660000000,660000000]`; O&M `[640000000]`; FULL FUND `[0]`; INITIAL SPARES `[20000000]`; OPN `[0]`; NOTE "Fiscal years included: FY2025, FY2026, FY2027, FY2028, FY2029, FY2030, FY2031." | fail |
| 6 | A · ownership: OGC Detail holds each carried row once, on its own appropriation | `['Synthetic carried O&M requirement','Synthetic carried O&M event','O&M','PSM','USAF',100000000,'OBLIGATED']` and `['Synthetic carried spares requirement','Synthetic carried spares event','INITIAL SPARES','ATL','USAF',20000000,'OBLIGATED']`; flowCalc recs have `fy:2026`, `pmoFull` 'Program (PSM)' / 'Program (ATL)' | fail (absent) |
| 7 | A · each offered year alone adds to ALL YEARS; each carried row counted once, in FY26 | 40,000,000 + 120,000,000 + 500,000,000 + 0 + 0 + 0 + 0 = 660,000,000 | fail (540,000,000; carried in no year) |
| 8 | A · ALL YEARS × O&M | 40,000,000 + 100,000,000 + 500,000,000 = 640,000,000; executed 140,000,000 | fail |
| 9 | A · FY26 saved alone, reopened (`buildSavedHtml`) | saved `[2026]`, selection `[2026]`, total 100,000,000 + 20,000,000 = 120,000,000; label `FY26 · all appropriations · + OBBBA FY25`; export NOTE "NOTE: includes 120000000 of OBBBA appropriated in FY2025 and counted here as FY2026 (2 plan events). Each row is counted in one fiscal year only." | fail (widens to ALL YEARS, 540,000,000) |
| 10 | CONTROL: A · FY25 alone | 40,000,000 (the carried rows count in FY26) | pass |
| 11 | A2 (every FY25 row carried) · ALL YEARS | 100,000,000 + 20,000,000 + 500,000,000 = 620,000,000; executed 120,000,000; O&M 600,000,000; INITIAL SPARES 20,000,000 | fail (500,000,000; 0) |
| 12 | A3 (only Initial Spares carries) · ALL YEARS | 40,000,000 + 20,000,000 + 500,000,000 = 560,000,000; executed 60,000,000; INITIAL SPARES 20,000,000; chips include FY26 | fail (540,000,000) |
| 13 | CONTROL: C(ii) `MS.base=2026` | ALL 660,000,000; FY26 120,000,000 | pass |
| 14 | CONTROL: C(iii) + O&M FY26 7,000,000 | ALL 667,000,000; FY26 127,000,000 | pass |
| 15 | CONTROL: C(iii-b) + Full Fund FY26 3,000,000 | ALL 663,000,000; FY26 123,000,000 | pass |
| 16 | CONTROL: C(iv), rule off | ALL 660,000,000; FY25 100,000,000 + 40,000,000 + 20,000,000 = 160,000,000, carried rows at `fy:2025` | pass |
| 17 | raw history: `EXDB.all` exactly as imported, in the board and in the reopened copy | equal | pass |

The fail/pass column for "today" is what `carry-probe.mjs` measured for the same fixture: 72 defect failures, 0 control
failures. The probe's own assertions cover checks 2–16 (check 9 as the unsaved explicit selection; the reopen is untested).

Labels and NOTEs in checks 4, 5 and 9 are predicted from the code. Confirm them when the block is first run on the fixed board.

## Mutations that would guard it

Each new mutation must apply exactly once, and the new block must catch it (text-only counter, then the sweep).

**New mutations:**

- `v200-carry1-year-unoffered` (area flowYears):
  - find: the new line, `  flowExecYears(null).forEach(f=>y[f]=1);         // CARRY-1: …`; repl `''`.
  - what: the year buttons offer the workbook's years and the plan window only. OBBBA rows carried into a year with neither
    are counted in no year. ALL YEARS is 540,000,000 of 660,000,000, with nothing said.
  - Caught by checks 2, 3, 4, 5, 6, 7, 8, 9, 11, 12.
- `v200-carry1-own-appn-only` (area flowYears):
  - repl: `  flowExecYears(flowPlanSlug()).forEach(f=>y[f]=1);`
  - what: only this board's appropriation opens the year its rows are carried into. Initial Spares' 20,000,000 carried into
    FY26 is counted in no year when O&M carries nothing.
  - Caught by check 12 only. That is why variant A3 is in the block.

**Existing mutations to re-verify after the change** (predicted from the code):

- `v200-r1-saved-year-widens` (find `  flowExecYears(null, true).forEach(f=>y[f]=1);`):
  - Still applies exactly once. The new line does not contain that text.
  - Still caught by R1 variant B "saved FY25 only, reopened": under it, FY25, whose rows are all carried, is no longer offered.
- `v200-r1-raw-year-exec` (`PS=null` in flowExecYears): now also caught by the new block. The new line becomes the raw scan, so
  FY26 is not offered.
- `v200-r1-scan-stops-early`:
  - Still caught by R1 variant A.
  - In the new block, FY26 stays offered (Initial Spares opens it), so money checks 3–8 are not claimed for it.
  - Check 2's chip text ("FY26" turns to "FY26 · plan") should catch it. Confirm when built.
- R1b's ten mutations (draft `out/mutations.json`): none finds text in `flowYears`. `v200-r1-stored-by-effective-year` anchors
  on `flowStoredIn` only. All should still apply exactly once.

## What users would see change

1. **A new year chip** appears in one situation: the carry target year (FY26 under the default rule) has no row filed under it in
   any appropriation and is outside the five-year window. This happens, for example, after the board moves to an FY27 base while
   FY25 OBBBA rows are still imported, or when the rule's from/to pair is set to a year neither imported nor planned.
   - The chip is unmarked when this board's appropriation has rows counted in that year.
   - It reads "· plan" when only another appropriation's rows are counted there. Its existing tooltip then says the other
     appropriations' execution is read from their import.
2. **ALL YEARS rises by exactly the carried amount**, wherever it appears:
   - the panel total and chart, and the PNG name and label;
   - the export: TOTAL FUNDING, US SERVICE FUNDING, US service appropriations, the per-appropriation lines, the prime and OGC
     totals, and the detail sheets, which gain the carried rows.
   - The executed figure rises by the same amount. Planned is unchanged.
   - Fixture A: 540,000,000 → 660,000,000.
3. **Notes and labels become true.** The "planned and executed" box and NOTE gain an FY26 line. The export's "Fiscal years
   included" lists FY2026. The scope label "FY25–FY31 · all years" is then accurate.
4. **A saved selection of that year is honoured.** It shows FY26 and its carried money, with the OBBBA NOTE, instead of silently
   showing ALL YEARS.
5. **One edge needs your decision.** Suppose another appropriation's carried rows open the year, this board's appropriation has
   nothing counted in it, and the board still holds plan state for that year (`MS.years[2026]` kept after the move to an FY27
   base). Then the existing rule ("a year with nothing imported is answered from this board's allocation") reads that year's
   plan, and ALL YEARS also gains this board's FY26 plan. That is consistent with how every offered year works today, but it is
   money beyond the carried rows.
6. **Unchanged:**
   - every configuration where the carry target is already offered (C(ii), C(iii), C(iii-b)), or where the rule is off (C(iv));
   - single-year views of FY25 and of the window years;
   - raw execution rows, the saved-file format, and the other appropriations' frames.

## Alternative, not recommended: disclose instead of count

This alternative would keep `flowYears()` as it is and say what is left out:

- In `flowCalc` (the store loop, L15550–L15566), add every row whose effective year is not in `flowYears()` to `F.unoffered = {v, n, fys}`.
- In `flowHtml`, beside the "Showing" line, add an amber line: "N of OBBBA appropriated in FY25 counts as FY26, a year this board
  does not offer: it is in no total here".
- In `exportFlow`, beside the OBBBA NOTE at L16660, add a matching NOTE.

That is three places and about ten lines, and the money still is not counted. Every exported product must be correct, so
counting is preferred. Disclosure would only be a fallback if a new year chip is unacceptable.

## Interaction with R1 / R1b

- R1b is now committed as 4a6f7c7.
- The change is independent of R1b's hunks, which are `flowIsMixed`, `flowStoredIn`, the tooltip, and the PY/MV note. It does
  not overlap them textually, and it applies the same way on 46b28b5, on 4a6f7c7 and on the draft.
- Without it, R1b's new wording is untrue in the CARRY-1 configuration (case A2). The FY25 tooltip and the planned-year note say
  the FY25 rows "are counted in FY2026 (OBBBA)", but FY26 is offered nowhere and is in no total. With this change, that wording
  becomes true.
- R1b has landed first (4a6f7c7). So until CARRY-1 lands, the committed board states something untrue in that
  configuration. Either land CARRY-1 next, or make the "counted in FY<to>" phrases conditional on
  `flowYears().indexOf(flowPseudo().to)>=0`.

## Open questions for Brad

1. Count the carried rows (recommended), or disclose them (the alternative above)?
2. Edge 5 above: when another appropriation's carry opens a year for which this board holds a plan, should that plan be read?
   That is the existing rule.
3. A selection saved for a year that is no longer offered still widens silently to ALL YEARS. That happens today for any
   vanished year, for example after switching the rule off with FY26 saved. It is a separate behaviour. Track it as its own item?
4. The export detail sheets carry no fiscal-year column. A carried row's effective year shows only through the Scope line and
   the OBBBA NOTE. Is that enough?
