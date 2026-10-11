# Before the final-tree queue: imminent product changes and the retests each requires (11 Oct 2026, written by 7:38 PM ET)

Brad, 7:17 PM ET: "Before starting the expensive final-tree queue, identify any imminent product changes and their required
retests. Keep the presweep and full gate paused pending the evidence matrix."

**Current product:** `4a6f7c7` (board `4d273c06…`). The backup head adds recovery files only.
- **Not started:** the final-tree queue (`bin/final-tree.sh`). It is held, see `RUNNING-CHECKS.md`. Any board change below
  would make its results stale, so it should run **once, after Brad's decisions have landed**.
- **Paused:** the presweep and the full gate.

## Candidate product changes

None of these is approved yet. Each waits for Brad. They are listed because any of them would change the board before the
final tree.

| # | Change | State | Board area (functions) | Size |
|---|---|---|---|---|
| U1 | Offer every year a row is counted in (`flowYears`) | **Built and measured on a disposable copy**: fails 15 before, passes all after. The diff, test block and two mutations are drafted. One edge needs a decision (E3: read the board's FY26 plan or not) | funds flow: `flowYears` | 1 line + comment |
| U8 | R1 wording: the Help document's funds-flow section; the matching-rules sentence for other appropriations; the FY26 button saying FY25 rows count in it; the net-zero execution test; and "plan events" said of executed rows | **Within R1's approved scope, to follow.** Not drafted | funds-flow text: `flowHtml` chip titles, the rules text, the export NOTE text; the Help document | wording |
| U2 | Put-back counted as a change, plus the option-1 refusal while saving | Scope proposed (`U2-REPAIR-SCOPE.md`) | save paths: `keptPutBack` | 1–2 lines |
| U13 | Folder pull waits while a save runs | Scope proposed; **reproduction first** | save paths: `driveStorePull` | 1 line |
| U3 | Refuse a queued Save under the hold at once (`saveInPlaceFile` and `saveInPlace`) | Proposed earlier | save paths | a few lines |
| U5 | R3: the stale on-screen "unsaved" flag (PROPOSAL item 2) | Proposed earlier | save paths: `_driveStorePushRun` / `cycLeave` | 1 line |
| U4, U6 | The hold window in the folder save; quiet-autosave wording | U4 not proposed; U6 to propose | save paths | – |
| U7 | R2: one expression for the checked and stored EEIC | To propose (robustness only) | `rcnSet` | 1–2 lines |
| U9 | PMO split: exact weights instead of float normalisation | Reproduced on the current tree; fix not proposed | `pmoSharesOf`, which feeds the PMO parts, the forecast and the PMO Matrix export | small, money-critical |
| U10 | Refused RCN edit changes a locked view's export codes | Reproduced; fix not proposed | `rcnSet` / `cycReapply` | small, export-critical |

## Retests each would require

**Fail-before/pass-after on the change's own block** applies to every change: a focused harness on a disposable copy, then
the committed block at the real commit.

| Change | Suites to re-run in full at its commit | Probes | Committed-suite sensitivity |
|---|---|---|---|
| U1 | audit-recon (≈1 min) | money (R1 part); carry-probe and verify-probe (fail-before at the parent, pass-after) | The 2 new `v200-u1-*` mutations and the 18 `v200-r1-*` in audit-recon (≈1 min each); applicability |
| U8 | audit-recon; boot-same | – | Any `v200-r1-*` whose find text the rewording touches. Re-anchor and re-run in audit-recon |
| U2, U13, U3, U5 (any save-path change) | **audit-import alone, 900 s + 20 s (≈9 min)** | races; r4b-contract; r3-late-window | Each new mutation in audit-import (≈9 min each). **Also the R3–R5 sequence now running at `af892cb` stops applying to the changed functions** and must be re-run on the final tree: 5 + 3 + 2 + 2 runs, ≈2 h |
| U7, U10 | audit-board (≈2.6 min); audit (Excel); audit-import if cycle locking is exercised there | code (R2 part) | `v200-r2-*` in audit-board; the new U10 mutations |
| U9 | audit (Excel); audit-recon; audit-other | money; the U9 reproduction probe (fail-before, pass-after) | New U9 mutations in the suites that catch them |

**Then, once, on the final tree:** the final-tree queue, which also covers the
[evidence matrix](#evidence-matrix-what-it-will-hold-and-what-is-in-hand) Brad asked for before any presweep.
- the full audit-import alone;
- the other nine suites;
- every `v200-r1-*` in audit-recon and every `v200-r2-*` in audit-board;
- verify:grid and standards;
- applicability.
- **Timing:** about 35–40 min without the audit-import sensitivity, or about 2.5 h with it.

## Recommendation for the order

1. **Brad decides** which of U1, U8, U2, U13, U3, U5, U9 and U10 land in v2.00, and settles U1's E3 edge.
2. **Land each as its own commit** with its focused evidence. Funds-flow changes (U1, U8) and save-path changes (U2, U13,
   U3, U5) are independent and can be prepared in parallel.
3. **Start the final-tree queue once,** on the commit that holds them all. If any save-path change landed, the audit-import
   sensitivity runs on that tree too.
4. **Build the evidence matrix.** Its columns: fresh at the final tree; justified reuse, with its reason; incomplete;
   remaining findings. It goes to Brad **before** the presweep.

## Evidence matrix: what it will hold, and what is in hand

These are the ingredients only; the matrix itself waits for the final tree.

| Ingredient | State |
|---|---|
| Integrated validation at `4a6f7c7`: probes, cross-checks, applicability | done |
| Full audit-import at `8f22668` and `af892cb` | done |
| audit-import sensitivity for R3–R5 at `af892cb` | **running** (see `RUNNING-CHECKS.md`) |
| R1/R2 sensitivity at the final commit | pending; in the held queue |
| U1 draft checks (this evening) | done; not integrated |
| Open findings | U1–U13 in `UNRESOLVED-LEDGER.md` |
