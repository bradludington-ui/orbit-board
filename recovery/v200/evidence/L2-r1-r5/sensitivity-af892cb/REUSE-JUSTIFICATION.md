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

## 5. Dynamic dependency scope (PENDING — runs alone after the sequence's DONE)

Static reading cannot rule out a path through `render()`, a saved file or an event. So the full audit-import is run once
on an **instrumented** copy of the 4a6f7c7 board (`board-4a6f7c7-cov.html`, blob `b1e1a51a…`).

- **The instrumentation:** each function below opens with `try{console.log('__COVHIT__ <name>');}catch(e){}`.
- **The counter:** a preload (`cov-hook.mjs`) counts those lines in Node through jsdom's VirtualConsole. It changes nothing
  else.
- **The run:** in the git clone of `d1ee751` (audit-import 4a6f7c7's `fc3117a0`), alone, at 900 s + 20 s.
- **Functions instrumented:**
  - **The changed ones:** `flowIsMixed`, `flowHasMoney`, `flowStoredIn`, `flowHtml` and `exportFlow`.
  - **The functions the pending proposals would change**, to scope their reuse in advance: `flowYears` (U1),
    `keptPutBack` (U2) and `driveStorePull` (U13).
  - **A reference:** `flowCalc`.
- **Positive control** (`reuse/cov-control.log`, `reuse/cov-control.json`): a board that calls each function once records every one of
  the nine names (flowYears 13, flowCalc 4, flowHasMoney 8, flowIsMixed 4, flowStoredIn 21, flowHtml 2, exportFlow 1,
  keptPutBack 1, driveStorePull 1). The counter does see calls.
- **Reuse is justified only if:**
  1. the instrumented run passes exactly as the uninstrumented one, with ALL CHECKS PASSED;
  2. it records **zero** calls to `flowIsMixed`, `flowHasMoney`, `flowStoredIn` and `flowHtml`.
- **If either fails,** the results at af892cb are **not** reused for 4a6f7c7, and the 12 runs are repeated at the final tree.

## 6. The label change (§2) and its effect

Each mutant's verdict at af892cb comes from the R3, R4 and R5 blocks (`summary.txt`, "scenarios"). The renamed R4b case is
in a different block from those that caught the mutants, but its checks still run on every mutant. So its verdict is part
of every run's "FAILING CHECK(S)" count. The label is used only as text, so the same verdict follows on 4a6f7c7, under the
new name. This rests on reading the code; no run tests it.

## Conclusion (provisional)

With §1–§4, and §5 if it reports zero calls and a pass, the af892cb results would stand for 4a6f7c7 as **justified reuse**.
The stated scope would be: the R3, R4 and R5 mutations of `_driveStorePushRun`, `_saveInPlaceFileRun`, `save` and
`driveRestore`, under a suite whose only change is one label.

The reuse **does not extend to a tree where U2 or U13 lands.** Those change `keptPutBack` and `driveStorePull`, and §5's
counts will show whether audit-import reaches them.
