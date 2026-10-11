# R1: the actual boxes, labels, tooltips and NOTEs, with the condition for each (11 Oct 2026, written 7:30–7:37 PM ET)

Brad, 7:17 PM ET: "Name the actual UI boxes covered by 'whole-total box' and show the tooltip/NOTE conditions."

Line numbers are for the current head product, `4a6f7c7` (board blob `4d273c06…`). They are read from the code. The
evidence column names where each behaviour is checked.

**Definitions used below.** `F = flowCalc()` on the selected years and appropriations.
- **Money:** `F.execV` is the executed money in the total; `F.planV` is the planned money.
- **"Has money":** `flowHasMoney(v)` means `|v| ≥ $0.005`.
- **This board's appropriation:** `own = flowPlanSlug()`, which is O&M on an O&M board.
- **Year kind** (`flowYearKind(y, a)`): `exec` when appropriation `a` has a row **counted** in year `y`, by effective
  year; otherwise `plan`.

## "Whole-total box" = the panel's planned-year box (P2)

This is the box that called the whole total "PLANNED, not executed".
- **Before R1b** (`46b28b5`, L16494–16502): its bold headline was always "FYxx is/are PLANNED, not executed" whenever the
  scope held a planned year. That was true even beside executed money, with "This scope mixes the two: $X executed, $Y
  planned" added after it. So with $40M executed and $500M planned, the box said "FY27–FY31 are PLANNED, not executed …
  This scope mixes the two".
- **R1b** (`4a6f7c7`) replaced that headline. Brad: "Replace any contradictory whole-total 'PLANNED, not executed' box with
  accurate executed/planned amounts."

| # | Surface (L = line at 4a6f7c7) | Shown when | What it says |
|---|---|---|---|
| **P2** | **Panel: the planned-year box.** A bordered box without a class, above "Showing…" (L16512–16523). | `PY.length > 0`. PY is the years in scope read from `own`'s plan alone: `F.planYs` minus the mixed years `F.mixYs` (L16415). | **Headline, when the total has executed money** (`flowHasMoney(F.execV)`): "**This total holds $X executed and $Y planned.** FY27, FY28 are planned years." **Headline, when it has none:** "**FYxx is/are PLANNED, not executed.**" This form now appears only for a total with no executed money. **Body, when MV is not empty** (MV = the years in PY under which **`own`** has rows filed, `flowStoredIn(y, [own])`; another appropriation's rows do not count, L16415): "The rows stored under FY25 are counted in FY26 (OBBBA)", plus " and nothing in scope has executed in FY27… yet" when PY has other years. **Body, when MV is empty:** "Nothing in scope has executed in that year / those years yet". Then: ", so the chart reads O&M's own allocation…; A planned year covers O&M only…". |

## Every other surface that says planned or executed

| # | Surface | Shown when | What it says |
|---|---|---|---|
| **P1** | **Panel: the gold box** `div.flowmix` (L16505–16509) | `flowIsMixed(F)`: executed **and** planned money in the selected total. Decided by money in every scope: one year, several, and ALL YEARS (R1). | "**Planned and executed money in one total.**", then one line per year in scope (`flowMixLines`): "FY25: O&M executed, FULL FUND, INITIAL SPARES, OPN not in this total; FY27: O&M planned, …". Then "Executed money is the imported CCaR QPE; planned money is O&M's own allocation. **$X executed, $Y planned.**" |
| **X3** | **Export NOTE** (Funds Flow sheet, L16688) | The same test as P1, `flowIsMixed(F)`, ALL YEARS included (Brad: "keep the mixed-funding export NOTE whenever the selected total includes both executed and planned money, including all-years views"). | "NOTE: planned and executed money in one total — <the same per-year lines as P1>. Executed is the imported CCaR QPE; planned is O&M's own allocation." The amounts are the sheet's own TOTAL FUNDING and appropriation lines. |
| **P3 / X1** | **The scope label** `F.label` (`flowScopeLabel`, L15362–15384). Printed in the panel's "Showing …" line (L16524), the chart titles and PNG (L15926, 15941, 16012, 16091, 16199), the drill caption (L16385), the table's TOTAL row (L16644), the export's "Scope:" line (L16664), the export file name (L16763) and the status line (L16766). | **Decided by year kinds, not money** (`flowYearMix` over the appropriations in scope): **(a)** some year in scope has an appropriation read from execution **and** `own` read from its plan; **(b)** otherwise, every year in scope has no appropriation read from execution; **(c)** otherwise, some years are planned and the rest executed; **(d)** otherwise, every year is executed. | **(a)** " · FY26: O&M planned, INITIAL SPARES executed, …", plus " · FY27, … planned". **(b)** " · **PLANNED (board allocation, O&M)**". With no execution counted anywhere in scope, `F.execV` is $0, so this cannot sit beside executed money. **(c)** " · FY27, FY28 planned, the rest executed". **(d)** nothing added. |
| **P4** | **Panel "Showing" line**, OBBBA part (L16524+) | `F.pseudo.n > 0`: carried rows are counted in the total. | " · **includes $X OBBBA, Mandatory** appropriated FY25, counted as FY26" |
| **X5** | **Export OBBBA NOTE** (L16680) | `F.pseudo.n > 0` | "NOTE: includes N of OBBBA appropriated in FY2025 and counted here as FY2026 (n plan events). Each row is counted in one fiscal year only." ("plan events" is said of executed rows too; observed, see U8.) |
| **X2** | **Export years NOTE** (L16691) | `F.multi`: more than one year selected | "NOTE: separate appropriation years added together — a portfolio total, not one year of funding. Fiscal years included: FY2025, …". On the U1 fixture today it omits FY2026; with the U1 fix it lists FY2026. |
| **C1** | **Year chip text** (L16426–16438) | `flowYearKind(f) === 'plan'` for `own` | "FY25 · plan"; otherwise "FY25" |
| **C2** | **Year chip tooltip, executed year** | `own` has a row counted in f | "FY2025 is answered from the imported CCaR QPE" |
| **C3** | **Year chip tooltip, planned year with `own`'s rows stored under it** (R1b) | kind `plan` **and** `flowStoredIn(f, [own])`: `own` has rows filed under f, all counted in a later year | "FY2025: the O&M rows imported for it are stored under FY2025 and counted in FY2026 (OBBBA), so FY2025 O&M is read from its plan — this board's own allocation" |
| **C4** | **Year chip tooltip, other planned years** | kind `plan`, nothing stored under f for `own` | "FY2027 has no O&M execution imported, so O&M is answered from this board's own allocation" |
| **C5** | **Suffix to C3 / C4** | any appropriation has a row counted in f (`flowExecYears()`) | "; other appropriations' execution for it is read from their import" |
| **C6** | **ALL YEARS chip tooltip** | always | "Every year this board can answer for — executed and planned together". **Untrue in the U1 configuration** until U1 lands: a year rows are counted in is not offered. |
| **C7** | **OBBBA chip tooltip** | always | "OBBBA money is appropriated in FY2025 and spent as FY2026. Switched on, it counts as FY26 — never in both, whatever years are selected." |
| **M1** | **Matching-rules text** (L16607) | the rules panel is open | "Each row is counted once, in its effective year — never twice. A year with execution counted in it is read from that execution, never also from the plan; a year left with none is a planned year, read from this board's allocation. …" |

## Where these are checked

| Surface | Check |
|---|---|
| P1 and X3 | The R1 block (variants A and B) and the R1b block (cases A, B and S), in audit-recon. |
| P2's two headlines and MV | The R1b block. Its MV checks ask only the board's own appropriation (case S). |
| C1 and C3 | The R1b block ("the FY25 button"). |
| P3/X1 forms (a)–(c) | The R1 and R1b blocks, and the U1 draft block, through `F.label` and the export's Scope line. |
| P2, P1, X2 and C2 on the U1 fixture | The U1 draft (`evidence/U1-carried-rows/proposed-diff-d1ee751/`): before and after values in the carry-probe results. |

**What is not covered by a check:**
- C4/C5 wording on a year opened only by another appropriation (U1 case A3, measured, not asserted);
- C6 and C7;
- M1's full sentence (only fragments are asserted).
