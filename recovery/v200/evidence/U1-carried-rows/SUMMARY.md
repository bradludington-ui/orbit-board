# U1, the carried-row omission: a bounded synthetic reproduction (11 Oct 2026, 6:25–7:02 PM ET)

Brad: "Track the carried-row omission as a separate finding. Run a bounded synthetic reproduction with independent
arithmetic, checking screen/export totals, ownership and explicit-year controls. Propose its correction separately."

**The finding:** with the carryover rule on, rows carried into a year that is neither a workbook year nor in the plan
window are left out of ALL YEARS, out of every offered year, and out of the export. Nothing states the amount.

**The reproduction** (`carry-probe.mjs`, blob 791df233…): one run per board, each 7–8 s, exit 0, deterministic.
- **Boards:** 46b28b5 (board 82c7f446…), the R1 follow-up draft, 4a6f7c7 (board 4d273c06…, the current head), and main
  f9b4413. All give identical figures, **so the omission predates R1, and the R1 follow-up changes no number.**
- **Checks per board:** 238. 166 pass (145 controls, 21 fixture checks); 72 fail, all of them defect checks.

**Fixture A:**
- **Setup:** an O&M board on plan window FY27–FY31, with no FY26 rows. FY25 rows:
  - O&M ordinary, ANG/TSS, $40,000,000;
  - O&M OBBBA, USAF/PSM, $100,000,000;
  - Initial Spares Mandatory, USAF/ATL, $20,000,000.
  The FY27 plan is USAF $350M + ANG $150M.
- **Expected ALL YEARS** (literal arithmetic): 40M + 100M + 20M + 350M + 150M = **$660,000,000**.
- **Observed:** **$540,000,000** on every surface. That covers the panel total, the executed/planned split
  ($40M/$500M against $160M/$500M), export TOTAL FUNDING (twice), US SERVICE FUNDING, and the appropriation lines (O&M
  $540M against $640M; INITIAL SPARES $0 against $20M).
- **The gap is exactly the carried $120M.** The surfaces agree with each other; all are short the same amount.
- **FY26 is not offered.** An explicit FY26 selection (`flowCfg().fys=[2026]`) is silently replaced by ALL YEARS.
  `flowCalc(2026)` holds the missing $120M, but no control reaches it.
- **No disclosure** in panel text, tooltips or export cells. The scope reads "FY25–FY31 · all years". The only trace is
  "Fiscal years included: FY2025, FY2027, …", where FY26 is missing.
- **Variants:** A2 (every FY25 row carried) shows $500M against $620M. A3 (only Spares carries) shows $540M against $560M.

**Ownership:** wherever the carried dollars are counted, their appropriation, office, service, requirement, event and
amount match the source row exactly.

**Explicit-year controls**, all correct:
- (ii) MS.base=2026: ALL YEARS $660M, and FY26 $120M with the NOTE.
- (iii) An O&M FY26 row of $7M: $667M.
- (iii-b) A Full Fund FY26 row of $3M: $663M. An unrelated $3M row raises ALL YEARS by $123M.
- (iv) Rule off: FY25 $160M, ALL YEARS $660M.

**The adversarial verifier:** issues with the proposal, none with the finding.
- It reproduced every figure on three boards, and hand-checked the expected values.
- Its own probe used a different rule (BRIDGE, FY28→FY29), different appropriations and amounts, and decoys. It
  reproduced the finding in general: for example ALL YEARS $15,412,344 against $25,566,668, short exactly the
  $10,154,324 carried.
- **Should-fix, for the proposal's test:** after the fix, the early-stopping year scan becomes money-critical. Its
  mutation `v200-r1-scan-stops-early` brings the omission back silently when one appropriation's carried row is filed
  behind an ordinary row and no other appropriation carries. The proposed block needs that layout (the verifier's V4)
  with literal totals.
- **Minor:** the proposal's "ALL YEARS rises by exactly the carried amount" is true unless the board holds plan state for
  the carry year and its own appropriation has nothing counted there. Then that year's plan is read too (VE3).

**Interaction with the R1 follow-up (4a6f7c7):** until this is fixed, the follow-up's "counted in FY2026 (OBBBA)" tooltip
and note are untrue in this configuration, because FY26 is not offered and is in no total.

**The proposal** (`PROPOSAL.md`, not built): one line in `flowYears()` that also offers every year a row is counted in
(`flowExecYears(null)`). With it, every carried dollar is counted in an offered year and in ALL YEARS, with no double
counting, and the precedence of execution over plan is unchanged. It comes with a committed audit-recon block and two
mutations. The verifier's V4 layout and the conditional wording above are to be added. Brad's decision is needed.
