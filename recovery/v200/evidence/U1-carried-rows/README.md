# CARRY-1: carried rows left out of ALL YEARS (reproduction, 11 Oct 2026)

This is a separate finding from R1. It was raised by the adversarial review of R1. This page reports a bounded, synthetic,
whole-board jsdom reproduction. Nothing was fixed. The proposed correction is in `PROPOSAL.md`.

**Verdict: reproduced, identically on every board probed.** With the funds-flow carryover rule on, an FY25 row carried into
FY26 is dropped from the total in one situation: FY26 is not a workbook year and is outside the plan window. The row is then
left out of ALL YEARS, out of every year the panel offers, and out of the export. Nothing on screen or in the file states the
amount.

- It holds on the R1 follow-up as committed at `4a6f7c7` (board 4).
- The panel, the export, the per-appropriation lines and the executed/planned split all agree with each other.
- They agree on the wrong number. The case A fixture shows **540,000,000 instead of 660,000,000**.
- FY26 cannot be selected. An explicit FY26 selection is silently replaced by ALL YEARS.
- `flowCalc(2026)` returns the missing 120,000,000, but no control reaches it.
- **The R1 follow-up (R1b) changes no number.** In one variant it adds the text "counted in FY26 (OBBBA)". That text is untrue
  in this configuration: FY26 is in no total.
- **It predates R1.** Main `f9b4413` gives the same totals.

## Boards probed

| # | Board | Board blob (git hash-object) | Tools / boot.mjs | Result file |
|---|---|---|---|---|
| 1 | Integrated tree `46b28b5b342e175fe099502e9f262dada3b2063a` (R1–R5 in) | `82c7f446b292af5a4c6f847170417eb9072df001` | from 46b28b5; boot.mjs `9c4f49ad8cec537097bdf485458cfd2a09b06594` | `results-46b28b5.json` |
| 2 | R1 follow-up draft (see note A) | `2365dacae7053bf69f1a982dcd5de0562966a182` | from 46b28b5 (board copied over copy 1) | `results-r1b-draft.json` |
| 3 | *Supplemental*: the same R1b patch on 46b28b5 (see note B) | `5b2c5856449a83be8aa046766b29fa88c4c159a9` | from 46b28b5 | `results-r1b-on-46b28b5-supplemental.json` |
| 4 | *Supplemental, added last*: the R1 follow-up as **committed**, `4a6f7c73ebf9018f6b1b14087cb5ec560a9bbb20` (see note C) | `4d273c0680132caafc4cbc8ca09c1533735c86de` | from 4a6f7c7; boot.mjs `9c4f49ad…` (unchanged) | `results-4a6f7c7-supplemental.json` |
| 0 | *Supplemental, provenance*: main `f9b441365551cd691a20a8f0b08a374a92a12f0e` | `b160bc031c7f70a4492f64394893d9b74bb0f327` | from f9b4413 (its own boot.mjs, same blob `9c4f49ad…`) | `results-f9b4413-provenance-supplemental.json` |

**Note A (board 2).** The board is `…/rec/L2/draft/R1b/wt/prioritization-board-grid.html`. That worktree is
`e635775ad1f33abe68af13bbae5557c6c3dd5543`, an ancestor of 46b28b5, plus the uncommitted R1b patch. Its `notes.md` says
"Draft built on e635775".

- Copied over copy 1 as instructed, board 2 is **not** 46b28b5 + R1b. It also lacks four non-flow changes that 46b28b5 has:
  - R2 follow-up `eeicWhy`;
  - R4 `impMixedBlock` re-check;
  - R3 follow-up locked-view save message;
  - R5 `_saveGen` / `_baseDirty`.
- None of these touches the funds flow. `diff` of board 2 against board 3 shows only those four hunks.

**Note B (board 3).** The board is `…/rec/L2/draft/R1b/head/prioritization-board-grid.html`, which is 46b28b5 plus exactly the
same 39 patch lines (compared line by line).

- It is the blob another session has **staged** in `/home/user/orbit-board`: index blob `5b2c5856…`.
- When this probe started, that repository's HEAD was `2b5b02b66dc66f2ebecf0df114d1582d62696f26`: ledger-only commits after
  46b28b5, with the committed board still `82c7f446…`. Its working tree held a further board, `4d273c06…`.

**Note C (board 4).** During this work, another session committed the R1 follow-up as `4a6f7c7`, board blob `4d273c06…`.
HEAD is now `fa467835e19b3da3314e996906b172387daacb00`, evidence only.

- Board 4 is board 3 plus one line in `flowHtml`: R1b's MV now asks only this board's appropriation. It does not touch
  `flowYears`, `flowCalc` or `exportFlow`.
- It was run from a `git archive` of 4a6f7c7.
- Its results are identical to board 3's apart from board identity: every figure, every check status, and every panel and export
  text.

Shim: `runtime-encoding-shim.mjs`, blob `6e2ce2e6beda9e7526527530500f254d877d0320`. Its sha256 is `e689710a2895d6843a66207d18ec886688b16f3c166b6ddada296e40a51c7981`, matching
`SHA256SUMS`.

Probe: `carry-probe.mjs`, blob `791df2337737076a84fd6947d7ad3053c465ee59`, sha256 `8ab2131bda7910d59929ec409d9dbb39ca47c176047a341bd9ab6d651f936417`.

Node v22.22.0, jsdom 27.4.0.

## Fixture (synthetic, whole dollars)

**Board.** O&M (`mySlug()` = `om`), services USAF and ANG.

- Plan: one requirement F1, "Synthetic planned requirement", PMO PSM. It is planned for **FY27 only**: `MS.years = {2027: S}`,
  `MS.cur = 2027`. The plan is USAF **350,000,000** + ANG **150,000,000**.
- The plan window is `MS.base..MS.base+4`. `MS.base` is 2027 except in C(ii).
- The carryover rule is the default `{label:'OBBBA', token:'OBBBA, Mandatory', from:2025, to:2026, col:4}`, switched on except
  in C(iv).

**Workbook rows.** Each uses the 32-column CCaR shape of the money probe: r[0] FY, r[3] title, r[4] Budget, r[7] event,
r[9] amount, r[10] 'Allocated', r[18] office.

| Key | Appn | Filed FY | Requirement | Budget (r[4]) | Amount | Office | Carried? |
|---|---|---|---|---|---|---|---|
| omOrd | O&M | 2025 | Synthetic ordinary FY25 O&M requirement | ANG O&M Discretionary | 40,000,000 | Program (TSS) | no |
| omCarry | O&M | 2025 | Synthetic carried O&M requirement | USAF O&M OBBBA | 100,000,000 | Program (PSM) | yes, OBBBA |
| spCarry | Initial Spares | 2025 | Synthetic carried spares requirement | USAF Spares Initial Mandatory PSM | 20,000,000 | Program (ATL) | yes, Mandatory |
| om26 | O&M | 2026 | Synthetic FY26 O&M requirement | USAF O&M Discretionary | 7,000,000 | Program (LOG) | no (C(iii) only) |
| ff26 | Full Fund | 2026 | Synthetic FY26 Full Fund requirement | USAF Full Fund | 3,000,000 | Program (ATL) | no (C(iii-b) only) |

**Cases.** Each case runs on one fresh board.

| Case | Kind | Plan window | Rule | Rows |
|---|---|---|---|---|
| A, the omission | defect | FY27–FY31 | on | omOrd, omCarry, spCarry (no FY26 row) |
| A2 (variant) | defect | FY27–FY31 | on | omCarry, spCarry (every FY25 row carried) |
| A3 (variant) | defect | FY27–FY31 | on | omOrd, spCarry (only Initial Spares carries) |
| C(ii) control | control | FY26–FY30 (`MS.base=2026`) | on | as A |
| C(iii) control | control | FY27–FY31 | on | as A + om26 (an O&M FY26 workbook row) |
| C(iii-b) control | control | FY27–FY31 | on | as A + ff26 (a Full Fund FY26 workbook row) |
| C(iv) control | control | FY27–FY31 | **off** | as A |

C(i) is case A with FY26 selected explicitly: `flowCfg().fys=[2026]`.

**What is read per scope.**

- `flowCalc()` through `flowCfg().fys` / `.aps`, including its rows.
- `flowYears()`, `flowSelYears()`, `flowExecYears(...)` and `flowPlanYears()`.
- The rendered panel (`flowOpen=true; flowBody()`): the "total funding", the stated executed and planned amounts, the boxes,
  the year chips with their tooltips, the OBBBA chip, and the roll-up drill tables for `hub|ext` and `hub|prime`.
- The exported workbook, captured exactly as the money probe does it (`exportFlow()` → Blob → `xlsxRead`):
  - TOTAL FUNDING, US SERVICE FUNDING and US service appropriations;
  - the per-appropriation lines;
  - the NOTEs and the Scope line;
  - Prime Detail and OGC Detail.
- In each case, every offered year on its own, and the internal `flowCalc(2026)`.

## Literal expected arithmetic

These are the contract: every carried dollar is counted in an offered year. No board helper is used.

| Case · scope | Total | Executed | Planned | O&M | Initial Spares | Full Fund | Offered years |
|---|---|---|---|---|---|---|---|
| A · ALL YEARS × all appns | 40,000,000 + 100,000,000 + 20,000,000 + 350,000,000 + 150,000,000 = **660,000,000** | 40,000,000 + 100,000,000 + 20,000,000 = 160,000,000 | 350,000,000 + 150,000,000 = 500,000,000 | 40,000,000 + 100,000,000 + 500,000,000 = 640,000,000 | 20,000,000 | 0 | FY25–FY31 incl. FY26 |
| A · ALL YEARS × O&M | 40,000,000 + 100,000,000 + 500,000,000 = **640,000,000** | 140,000,000 | 500,000,000 | 640,000,000 | – | – | |
| A · FY26 explicit (C(i)) | 100,000,000 + 20,000,000 = **120,000,000** | 120,000,000 | 0 | 100,000,000 | 20,000,000 | 0 | |
| A · FY25 (control) | **40,000,000** (the carried rows count in FY26) | 40,000,000 | 0 | 40,000,000 | 0 | 0 | |
| A2 · ALL YEARS | 100,000,000 + 20,000,000 + 500,000,000 = **620,000,000** | 120,000,000 | 500,000,000 | 600,000,000 | 20,000,000 | 0 | FY25–FY31 incl. FY26 |
| A3 · ALL YEARS | 40,000,000 + 20,000,000 + 500,000,000 = **560,000,000** | 60,000,000 | 500,000,000 | 540,000,000 | 20,000,000 | 0 | FY25–FY31 incl. FY26 |
| C(ii) · ALL / FY26 | **660,000,000** / **120,000,000** | 160,000,000 / 120,000,000 | 500,000,000 / 0 | 640,000,000 / 100,000,000 | 20,000,000 / 20,000,000 | 0 | FY25–FY30 |
| C(iii) · ALL / FY26 | + 7,000,000 → **667,000,000** / **127,000,000** | 167,000,000 / 127,000,000 | 500,000,000 / 0 | 647,000,000 / 107,000,000 | 20,000,000 | 0 | FY25–FY31 |
| C(iii-b) · ALL / FY26 | + 3,000,000 → **663,000,000** / **123,000,000** | 163,000,000 / 123,000,000 | 500,000,000 / 0 | 640,000,000 / 100,000,000 | 20,000,000 | 3,000,000 | FY25–FY31 |
| C(iv) · ALL / FY25 | **660,000,000** / 100,000,000 + 40,000,000 + 20,000,000 = **160,000,000** | 160,000,000 / 160,000,000 | 500,000,000 / 0 | 640,000,000 / 140,000,000 | 20,000,000 | 0 | FY25, FY27–FY31 |

**Ownership wherever a carried row is counted (literal).**

| Row | Appn | Effective FY | Service | PMO | Office | Event | Amount | Status |
|---|---|---|---|---|---|---|---|---|
| Synthetic carried O&M requirement | O&M | 2026 (2025 with the rule off) | USAF | PSM | Program (PSM) | Synthetic carried O&M event | 100,000,000 | OBLIGATED |
| Synthetic carried spares requirement | INITIAL SPARES | 2026 (2025 with the rule off) | USAF | ATL | Program (ATL) | Synthetic carried spares event | 20,000,000 | OBLIGATED |

## Observed: identical on boards 1, 2, 3, 4 and 0

Every figure, offered year, selection and carried-row record is identical on boards 1, 2, 3 and 4. On board 0 every figure is
identical; only wording differs (see further down). Check statuses are identical on all five.

Each board ran **238 checks**:

- **166 passed**: every control (145) and every fixture check (21).
- **72 failed**, all of them defect checks: A 42, A2 15, A3 15.

| Case · scope | Offered years | Selection used | flowCalc total | exec / plan | O&M | Init. Spares | Panel "total funding" | Panel stated exec / plan | Export TOTAL FUNDING (×2) / US SERVICE FUNDING | Carried rows in flow / drill / export |
|---|---|---|---|---|---|---|---|---|---|---|
| **A · ALL** | 2025, 2027–2031 (**no 2026**) | 2025, 2027–2031 | **540,000,000** | 40,000,000 / 500,000,000 | 540,000,000 | **0** | $540.00M | $40.00M / $500.00M | 540,000,000 / 540,000,000 | **0 / 0 / 0** |
| **A · ALL × O&M** | same | same | **540,000,000** | 40,000,000 / 500,000,000 | 540,000,000 | – | $540.00M | $40.00M / $500.00M | 540,000,000 / 540,000,000 | 0 / 0 / 0 |
| **A · FY26 explicit** | same | **2025, 2027–2031** (FY26 dropped; ALL YEARS chip on) | **540,000,000** | 40,000,000 / 500,000,000 | 540,000,000 | 0 | $540.00M | $40.00M / $500.00M | 540,000,000 / 540,000,000 | 0 / 0 / 0 |
| A · FY25 | same | 2025 | 40,000,000 | 40,000,000 / 0 | 40,000,000 | 0 | $40.00M | – | 40,000,000 / 40,000,000 | 0 / 0 / 0 (correct) |
| **A2 · ALL** | 2025, 2027–2031 | same | **500,000,000** | **0** / 500,000,000 | 500,000,000 | **0** | $500.00M | – | 500,000,000 / 500,000,000 | 0 / 0 / 0 |
| **A3 · ALL** | 2025, 2027–2031 | same | **540,000,000** | 40,000,000 / 500,000,000 | 540,000,000 | **0** | $540.00M | $40.00M / $500.00M | 540,000,000 / 540,000,000 | 0 / 0 / 0 |
| C(ii) · ALL | 2025–2030 | same | 660,000,000 | 160,000,000 / 500,000,000 | 640,000,000 | 20,000,000 | $660.00M | $160.00M / $500.00M | 660,000,000 / 660,000,000 | 2 / 2 / 2 |
| C(ii) · FY26 | | 2026 | 120,000,000 | 120,000,000 / 0 | 100,000,000 | 20,000,000 | $120.00M | – | 120,000,000 / 120,000,000 | 2 / 2 / 2 |
| C(iii) · ALL | 2025–2031 | same | 667,000,000 | 167,000,000 / 500,000,000 | 647,000,000 | 20,000,000 | $667.00M | $167.00M / $500.00M | 667,000,000 / 667,000,000 | 2 / 2 / 2 |
| C(iii) · FY26 | | 2026 | 127,000,000 | 127,000,000 / 0 | 107,000,000 | 20,000,000 | $127.00M | – | 127,000,000 / 127,000,000 | 2 / 2 / 2 |
| C(iii-b) · ALL | 2025–2031 | same | 663,000,000 | 163,000,000 / 500,000,000 | 640,000,000 | 20,000,000 (FF 3,000,000) | $663.00M | $163.00M / $500.00M | 663,000,000 / 663,000,000 | 2 / 2 / 2 |
| C(iii-b) · FY26 | | 2026 | 123,000,000 | 123,000,000 / 0 | 100,000,000 | 20,000,000 (FF 3,000,000) | $123.00M | – | 123,000,000 / 123,000,000 | 2 / 2 / 2 |
| C(iv) · ALL | 2025, 2027–2031 | same | 660,000,000 | 160,000,000 / 500,000,000 | 640,000,000 | 20,000,000 | $660.00M | $160.00M / $500.00M | 660,000,000 / 660,000,000 | 2 / 2 / 2 |
| C(iv) · FY25 | | 2025 | 160,000,000 | 160,000,000 / 0 | 140,000,000 | 20,000,000 | $160.00M | – | 160,000,000 / 160,000,000 | 2 / 2 / 2 |

**Each offered year on its own (all appropriations).**

- **A:** FY25 40,000,000 + FY27 500,000,000 + FY28–31 0 = 540,000,000. The two carried rows are in **no** year.
- **A2:** 0 + 500,000,000. Neither carried row is in any year.
- **A3:** 40,000,000 + 500,000,000. The carried 20,000,000 is in no year.
- **C(ii), C(iii), C(iii-b):** each carried row is counted once, in FY26.
- **C(iv):** each carried row is counted once, in FY25.
- In every case, the single years add up to that case's ALL YEARS total (control passes).

**`flowCalc(2026)` called directly** (the internal single-year path):

| Case | Result |
|---|---|
| A, A2 | 120,000,000 (O&M 100,000,000 + Initial Spares 20,000,000) |
| A3 | 20,000,000 |
| C(iii) | 127,000,000 |
| C(iii-b) | 123,000,000 |
| C(iv) | 0 |

The board can compute FY26. Its year controls cannot reach it.

### A. The omission (case A, ALL YEARS)

**Totals.**

- Total: 540,000,000 against the literal 660,000,000.
- Executed / planned: 40,000,000 / 500,000,000 against 160,000,000 / 500,000,000.
- Years offered: FY25, FY27, FY28, FY29, FY30, FY31. FY26 is not offered.

**The carried rows appear nowhere.**

- Not in any `flowCalc` row, in any offered-year scope.
- Not in the panel roll-up drill (`hub|ext`, `hub|prime`).
- Not in any cell of any exported sheet.

**Nothing discloses them.** No amount from {100,000,000; 20,000,000; 120,000,000} appears anywhere: not in the panel text, not
in any tooltip, not in any export cell. The probe searches for whole numbers, comma-grouped numbers and `$x.xxM`.

**What the screen and file do say:**

- **Panel "Showing" line and export Scope:** "FY25–FY31 · all years · all appropriations · FY27, FY28, FY29, FY30, FY31
  planned, the rest executed". The range "FY25–FY31 · all years" reads as including FY26. It does not.
- **Export NOTE:** "Fiscal years included: FY2025, FY2027, FY2028, FY2029, FY2030, FY2031." This is the only place FY26's
  absence is visible, and only by omission.
- **Export NOTE / panel box:** "FY25: O&M executed, FULL FUND, INITIAL SPARES, OPN not in this total". Initial Spares' FY25 row
  was imported and moved to FY26. It gets the same words as Full Fund and OPN, which have nothing imported. No amount is given.
- **OBBBA chip tooltip:** "OBBBA money is appropriated in FY2025 and spent as FY2026. Switched on, it counts as FY26 — never in
  both, whatever years are selected." In this configuration it counts in neither.
- **FY25 chip tooltip:** "FY2025 is answered from the imported CCaR QPE".

### B. Ownership

**Where the carried dollars appear** (C(ii), C(iii), C(iii-b) in FY26 and ALL YEARS; C(iv) in FY25 and ALL YEARS):

- Each carried row matches the source row exactly: appropriation, effective FY, service, PMO and office, requirement, event,
  amount and status. This holds in the `flowCalc` rec, in the panel drill row (e.g. `O&M | PSM | USAF | $100.00M | OBLIGATED`)
  and in the export OGC Detail row (e.g. `O&M | PSM | USAF | 100000000 | OBLIGATED`).
- Initial Spares' carried row stays on INITIAL SPARES (ATL, USAF, 20,000,000). It is never moved to O&M.
- **Observation:** the export detail sheets have no fiscal-year column. A carried row's effective year shows only through the
  Scope line and the "NOTE: includes 120000000 of OBBBA appropriated in FY2025 and counted here as FY2026 (2 plan events)".
  That NOTE is present for C(ii), C(iii) and C(iii-b) FY26.

**Where they do not appear** (A, A2 and A3 in every offered scope, and A with FY26 explicit): the carried rows are absent from
`flowCalc`, from the panel and from the export. No appropriation, service, office or requirement is shown for them anywhere.

### C. Explicit-year controls

**(i) FY26 selected explicitly**, through `flowCfg().fys=[2026]` on the case A fixture.

- **Filtered away** and silently replaced by ALL YEARS. `flowSelYears()` returns 2025, 2027–2031.
- The ALL YEARS chip renders on, and the label reads "FY25–FY31 · all years …".
- The total is 540,000,000 on the panel and in the export, against 120,000,000 for FY26.
- The selection is not honoured, and the carried dollars are not counted.
- `flowCfg().fys` stays `[2026]`, so FY26 would return if a later import made FY26 a workbook year.

**(ii) FY26 inside the plan window** (`MS.base=2026`): the carried dollars are counted in FY26.

- ALL YEARS: 660,000,000.
- FY26 alone: 120,000,000, with the OBBBA NOTE.
- Control passes.

**(iii) An FY26 workbook row present.**

- With O&M 7,000,000: 667,000,000. FY26 alone is 127,000,000.
- With Full Fund 3,000,000 (iii-b): 663,000,000. FY26 alone is 123,000,000.
- An **unrelated** 3,000,000 Full Fund row raises the ALL YEARS total by 123,000,000, because it makes FY26 offered.

**(iv) Rule off:** the carried rows count in FY25.

- FY25 alone: 160,000,000. ALL YEARS: 660,000,000.
- Control passes.

### D. Do the totals agree?

**With each other: yes, in every case and scope, on all boards.** These seven figures are equal everywhere:

- panel "total funding";
- `F.grand`;
- export TOTAL FUNDING (summary);
- export TOTAL FUNDING (reconciliation);
- US SERVICE FUNDING;
- the sum of the per-appropriation lines;
- executed + planned.

US service appropriations (both rows) agrees as well.

**With the literal arithmetic: every disagreement.** All are in A, A2 and A3, and each is the carried amount.

| Case · scope | Surface | Observed | Literal | Short by |
|---|---|---|---|---|
| A · ALL | flowCalc total; panel total funding ($540.00M); export TOTAL FUNDING ×2; US SERVICE FUNDING; US service appropriations ×2 | 540,000,000 | 660,000,000 | 120,000,000 |
| A · ALL | executed (flowCalc; panel "$40.00M executed" ×2) | 40,000,000 | 160,000,000 | 120,000,000 |
| A · ALL | O&M line (flowCalc; export) | 540,000,000 | 640,000,000 | 100,000,000 |
| A · ALL | INITIAL SPARES line (flowCalc; export) | 0 | 20,000,000 | 20,000,000 |
| A · ALL | years offered | 2025, 2027–2031 | 2025–2031 | FY26 |
| A · ALL × O&M | total (every surface) / executed / O&M line | 540,000,000 / 40,000,000 / 540,000,000 | 640,000,000 / 140,000,000 / 640,000,000 | 100,000,000 each |
| A · FY26 explicit | selection | 2025, 2027–2031 | 2026 | FY26 dropped |
| A · FY26 explicit | total (every surface) / exec / plan | 540,000,000 / 40,000,000 / 500,000,000 | 120,000,000 / 120,000,000 / 0 | wrong scope |
| A · FY26 explicit | O&M / INITIAL SPARES lines | 540,000,000 / 0 | 100,000,000 / 20,000,000 | wrong scope |
| A2 · ALL | total (every surface) | 500,000,000 | 620,000,000 | 120,000,000 |
| A2 · ALL | executed | 0 | 120,000,000 | 120,000,000 |
| A2 · ALL | O&M / INITIAL SPARES lines | 500,000,000 / 0 | 600,000,000 / 20,000,000 | 100,000,000 / 20,000,000 |
| A3 · ALL | total (every surface) | 540,000,000 | 560,000,000 | 20,000,000 |
| A3 · ALL | executed / INITIAL SPARES line | 40,000,000 / 0 | 60,000,000 / 20,000,000 | 20,000,000 |
| A, A2, A3 | carried amount disclosed on the panel or in the export | none | stated, or counted | all of it |

### What the R1 follow-up changes (board 2; the same on boards 3 and 4)

**No number, no offered year, no selection.** All 238 check statuses are identical. The changes are wording only:

**A, A2, A3 and the controls: the planned-year box.**

- Before: "FY27 … are PLANNED, not executed … This scope mixes the two: $40.00M executed, $500.00M planned".
- After: "This total holds $40.00M executed and $500.00M planned. FY27, FY28, FY29, FY30, FY31 are planned years."
- In A, the $40.00M is still 120,000,000 short.

**A2: new text that is untrue in this configuration.**

- **FY25 chip tooltip**, on 46b28b5: "FY2025 has no O&M execution imported, so O&M is answered from this board's own
  allocation". That statement is false.
- On R1b: "FY2025: the O&M rows imported for it are stored under FY2025 and counted in FY2026 (OBBBA), so FY2025 O&M is read
  from its plan — this board's own allocation".
- **Planned-year box**, on 46b28b5: "Nothing in scope has executed in those years yet". That statement is false: 120,000,000
  was imported under FY25.
- On R1b: "The rows stored under FY25 are counted in FY26 (OBBBA) and nothing in scope has executed in FY27 … yet".
- Both R1b texts say the rows are **counted in FY26**. FY26 is not offered and is in no total. No amount is given.
- So R1b's new wording is accurate only when the carry target year is offered. With the correction in `PROPOSAL.md` it becomes
  accurate.

### Provenance (board 0, main f9b4413)

The totals, offered years, selections and carried-row records are the same as on 46b28b5. The omission **predates R1**:

- At f9b4413, `flowYears()` was workbook years ∪ plan window.
- R1 kept that deliberately: "the workbook's years, as before -- a saved year stays offered".

Only wording differs on f9b4413. These are the known R1 label defects:

- C(ii) FY26 is labelled "PLANNED (board allocation, O&M) · + OBBBA FY25".
- A2 ALL is labelled "… FY27 … planned, the rest executed", with "This scope mixes the two: $0.00M executed".
- C(iii-b) FY26 is labelled "FY26: O&M planned, FULL FUND executed".
- Some boxes state the amounts once rather than twice.

## How it can happen

All of the following must hold:

1. The carryover rule is on.
2. FY25 rows are matched by the token (OBBBA or Mandatory in the Budget cell).
3. **No appropriation** has any row filed under FY26.
4. FY26 is outside `MS.base..MS.base+4`.

The rule is user-configurable (`flowSetPseudo`: any `from`/`to` in 1900–2200). The code comment says "next year it will be a
different one". So a pair whose `to` year is neither imported nor in the window drops that money silently. C(iii-b) shows that
whether the money is counted depends on an unrelated appropriation's rows.

## Runs

Every run was `setsid -w timeout -k 10 600 node carry-probe.mjs <copyRoot> <out.json> <label>`, through `run.sh`, and recorded
in `../pids.txt`.

- Each run is under 9 s wall-clock, about 6–7 s inside the probe.
- No full suite, mutate.mjs, gate, verify:grid, standards check, playwright install or validate:math was run or imported.
- No process is left running. `ps` showed none after each batch.

| Run | Board | Exit | Wall (s) | Note |
|---|---|---|---|---|
| run1-46b28b5 | 1 | not captured | ~7 (probe 6.8) | First run. `setsid` forked under job control, so `wait` returned at once; the node PID was then waited on with `tail --pid`. 57 defect + 8 control failures; the 8 were an ordering artefact in the probe (flowCalc lists rows by category). Superseded. |
| run2-46b28b5 | 1 | 0 | 7.92 | After the order fix; 6 cases (before A3). Superseded. |
| run1-r1b-draft / run1-r1b-on-46b28b5 | 2 / 3 | 0 / 0 | 7.73 / 8.40 | 6 cases. Superseded. |
| run1-f9b4413 | 0 | 0 | 6.60 | 6 cases. Superseded. |
| run3 / run2 determinism | 1 / 2 | 0 / 0 | 7.15 / 7.27 | 6 cases. Byte-identical to their first runs. Superseded. |
| **final-46b28b5** | **1** | **0** | **7.09** | Final probe (A3 added, ordinary row first): 166 passed, 72 failed (all defect) |
| **final-r1b-draft** | **2** | **0** | **8.23** | Same 166 / 72 |
| final-r1b-on-46b28b5 | 3 | 0 | 7.25 | Same 166 / 72 |
| final-f9b4413 | 0 | 0 | 8.26 | Same 166 / 72 |
| final-46b28b5-determinism | 1 | 0 | 8.84 | `results-46b28b5.json` **byte-identical** |
| final-r1b-draft-determinism | 2 | 0 | 7.78 | `results-r1b-draft.json` **byte-identical** |
| final-4a6f7c7 | 4 | 0 | 7.56 | Same 166 / 72; added after 4a6f7c7 was committed |

**Exit codes.** Exit 0 means the probe ran to the end with every control and fixture check passing. Exit 3 would mean a control
or fixture check failed. The defect checks are expected to fail on a board with the omission.

**Result files (sha256):**

| File | sha256 |
|---|---|
| results-46b28b5.json | `e753b154ab5bb101e1100050be17081dbf26b91d2a3db4a57e3f12a52c3c67de` |
| results-r1b-draft.json | `b4040033fe519327d86ab027afc76e85dc8fb6a86a7fb3da9a911bacd0007769` |
| results-r1b-on-46b28b5-supplemental.json | `2413c17b1431a081d21380f576784c6928e88880336532db47a5182b957835b3` |
| results-f9b4413-provenance-supplemental.json | `813ed70c823a4111fa36a615ed96ade647140c64f9953467349c0e679b6a1c5c` |
| results-4a6f7c7-supplemental.json | `0adf5ee0f4bdd729a5862a417c7f0fe4d990fea51a6dcbeba9a92fea74357940` |

Results contain no timings. Timings are printed to the logs in `../logs/`.

**Setup:**

```sh
W=/tmp/claude-0/-home-user-Word-Matching-/0eabf6ef-e470-5d8a-8224-885f500b9576/scratchpad/rec/L2/carry
git -C /home/user/orbit-board archive 46b28b5b342e175fe099502e9f262dada3b2063a prioritization-board-grid.html tools package.json | tar -x -C $W/b1/copy
ln -s /home/user/orbit-board/node_modules $W/b1/copy/node_modules
cp /home/user/orbit-board/recovery/v200/probes/received-2026-10-11/runtime-encoding-shim.mjs $W/b1/copy/
# b2: same as b1, then  cp …/rec/L2/draft/R1b/wt/prioritization-board-grid.html   $W/b2/copy/
# b3: same as b1, then  cp …/rec/L2/draft/R1b/head/prioritization-board-grid.html $W/b3/copy/
# b0: git archive f9b441365551cd691a20a8f0b08a374a92a12f0e (its own board and tools), same link and shim
# b4: git archive 4a6f7c73ebf9018f6b1b14087cb5ec560a9bbb20 (its own board and tools), same link and shim
$W/run.sh $W/b1/copy $W/out/results-46b28b5.json 46b28b5 final-46b28b5
$W/run.sh $W/b2/copy $W/out/results-r1b-draft.json r1b-draft final-r1b-draft
```

## For the evidence matrix

**Fresh: this probe.**

| Tree | Board blob | Result |
|---|---|---|
| 46b28b5 (also HEAD 2b5b02b, same board blob) | `82c7f446…` | CARRY-1 reproduced; every control passes |
| R1b draft | `2365dacae…` | Same numbers |
| R1b on 46b28b5 (the then-staged blob) | `5b2c5856…` | Same numbers |
| **R1 follow-up as committed, 4a6f7c7** | `4d273c06…` | **Same numbers; same untrue "counted in FY2026" wording in A2** |

**Applicable after the R1 follow-up.** Every money result above applies unchanged at 4a6f7c7. This is measured, not inferred:
the follow-up touches no number.

**Incomplete.**

- The proposed correction is not built or tested; its post-fix values in `PROPOSAL.md` are predictions.
- No committed audit block covers CARRY-1 yet.
- No full suite was run here.

**Remaining findings.**

- CARRY-1 (this finding) is open.
- R1b's "counted in FY26 (OBBBA)" wording is untrue whenever CARRY-1's configuration holds. It stays so until CARRY-1 is
  corrected, or until the wording is made conditional.
