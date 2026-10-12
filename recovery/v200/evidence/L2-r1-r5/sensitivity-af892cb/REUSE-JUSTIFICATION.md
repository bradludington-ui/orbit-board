# Can the audit-import sensitivity results at `af892cb` stand for `4a6f7c7`? (11 Oct 2026, written 8:16–8:24 PM ET)

Brad, 8:14 PM ET: "Justify reuse with exact board/tool identities and applicable dependency scope; 'audit-import calls no
changed code' alone is insufficient."

**My earlier statement was too thin, and partly wrong.** At 6:44 PM ET I wrote that the audit-import results stay applicable
because "audit-import calls no changed flow functions". In fact `audit-import.mjs` itself **differs** between the two commits:
one test label changed (§2). Below is the complete argument, with each premise checked separately. The one dynamic premise
(§5) is **pending**; it runs alone after the sensitivity sequence finishes. Until it reports, this reuse is **unproven**.

## 1. Exact identities

| | `af892cb12713dd22afd9a84c0ec604b30614f6ea` (where the runs ran) | `4a6f7c73ebf9018f6b1b14087cb5ec560a9bbb20` (the current product; `d1ee751` is identical) |
|---|---|---|
| prioritization-board-grid.html | `82c7f446b292af5a4c6f847170417eb9072df001` | `4d273c0680132caafc4cbc8ca09c1533735c86de` |
| tools/export-audit/audit-import.mjs | `28c04e49fea3e383b02738081ed4a6ab004c4521` | `fc3117a075176879bedaab66a586b2c7a23be498` |
| tools/export-audit/boot.mjs | `9c4f49ad8cec537097bdf485458cfd2a09b06594` | `9c4f49ad8cec537097bdf485458cfd2a09b06594` (same) |
| tools/export-audit/mutate.mjs | `6c084989caae7339d0445701dc54ca9161603488` | `8e7a362fa87e9440f4b45d7c68ad53b5ad6d2916` |
| package.json | `7cf8186faa9b2dc26fbc3a95fd2b6296e867b384` | `7cf8186faa9b2dc26fbc3a95fd2b6296e867b384` (same) |
| Node / jsdom | v22.22.0 / 27.4.0, `/home/user/orbit-board/node_modules/jsdom` | the same installation, by `realpath` from both clones |

## 2. What differs in the suite and in the board

**audit-import.mjs** (changed by `46b28b5`, "one test label"). One string changed, at L7030. It is the third case label of
the R4b block:
- before: `'hold on, read held and the hold cleared during it'`
- after: `'hold on, cleared after the refusal (a held read is reached only if the first check is gone)'`

The tuple's other values (`true, true`) and every statement of the block are unchanged. The label appears only in the
`where` text of that block's checks. It decides no verdict and no control flow, but it does change that block's printed
check names.

**The board** (`82c7f446` → `4d273c06`, the R1 follow-up). Eight hunks, all in the funds flow:
- **`flowIsMixed`:** rewritten.
- **New functions:** `flowHasMoney` and `flowStoredIn`.
- **`flowHtml`:** five hunks covering the planned-year box, the FY25 tooltip and the MV note.
- **`exportFlow`:** one added **comment** line only.
- No other function changed.

## 3. Each mutation is the same mutation on both boards

For the 12 mutation ids in the sequence (`reuse/mutation-equivalence.txt`; read as text with `mcread.py`; nothing executed):
- **Find and replacement text:** identical in both catalogs for **11 of 12**.
  - `impmixed-file-unguarded` was re-anchored in R1b; its find and replacement text differ.
- **Applicability:** every one applies **exactly once** on both boards.
- **The mutants:** for all 12, the 4a6f7c7 mutant differs from the af892cb mutant **exactly by the board's own R1-follow-up
  diff**, and by nothing else. So the mutation hunk and the R1b hunks never overlap, and the re-anchored entry builds the same
  mutation.
- **Mutation lines** (at af892cb): 6769, 8314, 8344, 26767, 26837, 27049. They are far from the funds-flow hunks at
  15475–16687.

## 4. Static dependency scope

- **`audit-import.mjs`** names only the funds-flow **entity** functions: `flowEnts`, `flowEnt`, `flowEntName`, `flowSetEnt`,
  `flowAddEnt`, `flowDelEnt`, `flowEntsAZ`, `flowDefEnts`, `flowEntEditor`. It never names `flowIsMixed`, `flowHasMoney`,
  `flowStoredIn`, `flowHtml`, `flowBody`, `exportFlow` or `flowToggle`, and never sets `flowOpen`.
- **In the board:**
  - `flowHtml` runs only from `flowBody`, and only when `flowOpen` is true (L15706).
  - `flowOpen` is set only by `flowToggle` (L15699).
  - `exportFlow` runs only from the panel's own button (L16483).
  - `flowIsMixed` is called only in `flowHtml` and `exportFlow`; `flowStoredIn` only in `flowHtml`; `flowHasMoney` only
    from those two.

## 5. Dynamic dependency scope: SUPPORTING EVIDENCE ONLY (Brad, 8:32 PM ET: "zero baseline calls are supporting evidence only")

**What was run.** The full audit-import, once, on an **instrumented** copy of the 4a6f7c7 board (`reuse/board-4a6f7c7-cov.html`,
blob `b1e1a51a…`).
- **Where and how:** alone, in the git clone of `d1ee751` (audit-import `fc3117a0`), at 900 s + 20 s.
- **Instrumentation:** each function below opens with a `__COVHIT__` console line, which `reuse/cov-hook.mjs` counts in Node.
- **Positive control:** each of the nine names records a hit when called (`reuse/cov-control.json`).

**Result** (`reuse/audit-import-cov-4a6f7c7.log`, `reuse/audit-import-cov-hits.json`, 8:49–8:57 PM ET): exit 0, 512.7 s,
**ALL CHECKS PASSED**.

| Function | Calls during the whole suite |
|---|---|
| `flowIsMixed`, `flowHasMoney`, `flowStoredIn`, `flowHtml`, `exportFlow` (the changed ones) | **0** |
| `flowCalc`, `flowYears` (reference; U1's target) | **0** |
| `keptPutBack` (U2's target) | **2** |
| `driveStorePull` (U13's target) | **54** |

Zero calls show that the R1-follow-up code never ran under this suite. They do not, on their own, prove that the R3–R5
verdicts carry over.

## 6. The label change (§2) and its effect
The R4b case label is used only as text. The focused reruns below show the R4b checks reaching the same verdict under the
new name.

## 7. Focused reruns, labelled separately from the full-suite catches (8:59–9:12 PM ET)

**The harness.** It copies verbatim from each commit's own suite:
- the imports, the failure list, `keepBoards` and `SEEN`/`chk`;
- the four v2.00 blocks (R3, R3 message, R4/R4b, R5);
- the scenario-ran guard;
- by closure, every top-level helper those blocks reference (`focused/mkfocused-import.py`).

| | Harness blob |
|---|---|
| 4a6f7c7 | `94c59963…` |
| af892cb | `ab4d2c14…` |

The two harnesses differ only by the R4b label. Each ran on its commit's unmodified board and on its 12 mutants, one run at a
time with a 600 s cap. The mutants rebuilt here are byte-identical to the full-suite mutants.

**An earlier harness was missing helpers**, so its blocks threw (`focused/invalid-harness-v1/`). It is **invalid**, kept and
not counted.

| Mutation | **Full suite** at af892cb (catching scenarios) | **Focused** at af892cb | **Focused** at 4a6f7c7 |
|---|---|---|---|
| BASE (unmutated) | ALL CHECKS PASSED | ALL CHECKS PASSED | ALL CHECKS PASSED |
| v200-r3-cycblock-gone / -falls-through | 4 failing (R3) | 4 (R3) | 4 (R3) |
| v200-r3-cycblock-says-saved | 2 (R3) | 2 | 2 |
| v200-r3-landed-view-unsaid / -prefix | 2 (R3 message) | 2 | 2 |
| v200-r4-no-recheck / -said-not-held | 3 (R4) | 3 | 3 |
| v200-r4-held-quietly | 1 (R4) | 1 | 1 |
| v200-r5-restore-gen | 4 (R5) | 4 | 4 |
| v200-r5-restore-basedirty | 1 (R5) | 1 | 1 |
| impmixed-file-unguarded | 5 (**R4b**, the block whose label changed) | 5 | 5 |
| unsaved-flag-never-set | 36, from **older blocks**: v1.89 saving never silently overwrites; v1.95 Save acknowledges (file and folder); v1.95 kept work never replaced; v1.95 and v1.96 Put this back; v1.96 NR05; v1.97 item 79 | **not covered**: passes (its catching blocks are outside the harness) | **not covered**: passes |

**Reading it:**
- For 11 of the 12, the focused verdict, the count and the catching scenarios are identical at both commits, and equal to
  the full-suite catch.
- For `impmixed-file-unguarded`, the focused rerun at 4a6f7c7, under the renamed R4b block, catches it with the same 5
  checks.
- For `unsaved-flag-never-set`, no focused rerun was made. Its catching blocks (v1.89–v1.97 save-path blocks) are
  byte-identical in both suites, since only the R4b label differs. The function it mutates (`save()`) is unchanged, and
  §3–§5 hold for it. Its reuse therefore rests on §1–§5 alone. If that is not accepted, it is the one run to repeat in full.

## Conclusion (under the tightened rule)

The af892cb **full-suite** results are reused for 4a6f7c7 as **justified reuse** for the 12 mutations. The scope is the
R3–R5 protections in `_driveStorePushRun`, `_saveInPlaceFileRun`, `save` and `driveRestore`. The grounds are:
1. exact identities (§1);
2. complete diffs: a board change confined to funds-flow code, and a suite change of one label (§2);
3. identical mutation transformations (§3);
4. static dependency scope (§4);
5. dynamic call counts, as supporting evidence (§5);
6. focused reruns of the affected scenarios at both commits, labelled separately (§7).

**Limits:**
- `unsaved-flag-never-set` has no focused rerun (§7).
- **This reuse ends where U2 or U13 lands.** audit-import calls `keptPutBack` and `driveStorePull` (§5), so a change to either
  needs fresh full-suite and sensitivity runs at its commit.
