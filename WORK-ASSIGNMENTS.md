# ORBIT work assignments

Brad controls assignments and release scope. Read this file and AGENTS.md before starting. Share each assignment with both sessions: this file does not provide a live communication channel or locking mechanism. Update assignments only in an authorized interactive task; scheduled monitors never write here.

## Standing lanes

| Role | Default owner | Boundary |
|---|---|---|
| Release implementation and integration | Claude | Board edits only on Brad's go and approved release scope |
| Independent review | Codex | Read-only review of exact main and all relevant PR head SHAs |
| Assigned fixes or tests | Agent explicitly named by Brad | Exclusive editing window; outgoing editor must stop first |
| Release gate | One owner explicitly named by Brad | No duplicate long gates; retain pinned evidence |
| Windows and native export acceptance | Brad or designated human operator | Synthetic disposable files; record versions and tested SHA |
| Merge and publication | Brad-authorized operator | Review completion alone does not authorize either action |

## Current implementation assignment

- Task and approved scope: v2.12 -- items 132 (a WBS paragraph on every requirement, picked from the ACE; the ACE import
  by its header titles; PSM inside Air Vehicle and the AV + PSM split; Needs attention lists every requirement without a
  WBS; Classify sets one in bulk; the Spend Plan Source carries the WBS; the FYDP Spend Plan's STOVL tab) and 134 (every
  year's budget authority read live from the PPBE position assigned; over and under flagged, no automatic cut; unallocated
  added funding shown as UPL, the last line; locked cycles keep the position as it was locked), as logged in
  NEXT-VERSION.md with Brad's answers of 28 Oct (Brad, 28 Oct: "Go on v2.12"), and his answer on a one-figure PPBE
  position for the live budget (R37: "Keep my lane split (Recommended)"). Its extension to Take from a PPBE position and
  FYDP Disconnects is built and awaits his confirmation (question 7). Item 133 (the Service share workbook) is v2.13 and
  not in scope.
- Owner and outgoing owner's explicit stopped status: Claude (Claude Code session on ccr-0b15d8d5-ypf61n), with three
  builders (W1 the ACE import by its header titles, W2 a WBS paragraph on every requirement, W3 item 134) on branches
  v212-w1/-w2/-w3 to one contract (recovery/v212/contract.md; the map of the code, map.md), and six fixers (RV1-RV3 on
  W1's, W2's and W3's code after the first review, RV4-RV6 on the same three after the second; branches v212-fix1 to
  -fix6). Each builder and fixer stopped at its merge (W1 9cfb408, W3 2bafb12, W2 e2f6813, RV1 2ef3e33, RV3 ed99419, RV2
  103f2f0, RV6 0509f2c, RV5 d527b59, RV4 4277e9a). The lead's own commits on v212-int are Claude's: Brad's R37 rule at
  56df08b (proofs-R37.json, 5 of 5 caught), the hostile plants for W2's WBS names at 6daac7d, the reviews' findings
  (c23e8a0 for the first, c81e995 for the second), the combined proofs, the integrated run and the two checks it
  strengthened (e665914, b8420fc), BUILD at 85c1017, the guide's trim at d630240, and the PMO-copy Save check's storage
  seeding at 3e29863. Claude stops edits at the handoff commit. v2.11 is merged (PR #29, bbb7ee9).
- Allowed files and excluded scope: prioritization-board-grid.html, tools/**, package.json, NEXT-VERSION.md, CLAUDE.md,
  AGENTS.md, math-defects.json, recovery/v212/**, the item 133 mock-up logged before the build
  (recovery/item133-mockup/**, no board change) and this entry. Excluded: the sweep (no named go), item 133's workbook,
  items 100 and 107.
- Isolated branch and base commit SHA: ccr-0b15d8d5-ypf61n, based on main bbb7ee9 (v2.11) plus the item 132-134 logging.
  The builders branched from the slot commit d732259, RV1-RV3 from c23e8a0 and RV4-RV6 from c81e995; all were integrated
  on v212-int.
- Status: closed. Merged as PR #30 at fe0c83d (a merge commit), 1 Nov 2026 7:14 PM EST, on Brad's "Merge". No v2.13
  owner or scope is named yet: see recovery/v213/HANDOFF.md.
- Required bounded checks and designated gate owner: npm run check; every suite; the browser checks (verify:grid, keys,
  dropdowns, dialogs, leftmenu, pmosave, pmoyears, pointer, standards); each new mutation proved with
  recovery/v208/bin/prove.py; mcount; review with skeptics; validate:nightly on the final tree. Gate owner Claude. No
  sweep.
- Handoff commit SHA and changed files: the commit that carries this entry, on 3e29863, the tree as it ships (its board is d630240's: 3e29863 changes only tools/pmo-save.mjs and adds its record; ccr-0b15d8d5-ypf61n, draft PR #30; the PR names the head), against main bbb7ee9. The
  board: prioritization-board-grid.html (BUILD 'v2.12 (1 Nov 2026)'). The jsdom suites:
  tools/export-audit/{audit-board,audit-other,audit-recon,audit-import,audit}.mjs; the hostile board that audit-hostile
  and hostile-render plant and sweep: hostile.mjs; the mutation list: mutate.mjs. The browser checks:
  tools/{layout-fits,keyboard-reach,dialogs-keyboard,panels-render,standards-check,left-menu,pmo-save}.mjs, and the new
  tools/ace-seed.mjs (the cost estimate import's two boxes, put on a board for five of those checks to measure). The
  registries: tools/money-coverage.mjs, tools/money-map.json and tools/money-map.md. The file verifier:
  tools/verify-file.mjs (its self-test's 2026 estimate line is filed under AV). The records: NEXT-VERSION.md, CLAUDE.md,
  this entry, recovery/v212/** (contract, map, notes, reviews, proofs), and the item 133 mock-up
  (recovery/item133-mockup/**).
- Commands, seeds, durations, exit statuses and results: on d630240 (the board as it ships; 3e29863 changes only tools/pmo-save.mjs, and the handoff commit adds only
  the records), npm run check passes; mcount 3,149 targets, each matching once; money coverage 27/27; the money map 322
  cells (119 proven, 202 n/a, 1 open: `aiExport` by fiscal year, open since v2.04). Every suite whole on the final tree
  (audit-board, audit-recon and audit-import at --max-old-space-size=8192): all clean (8 banners and the legacy line), inside the nightly. The browser checks: keys, dropdowns, dialogs, leftmenu, pmoyears, pointer and standards (0 findings) pass on d630240; pmosave failed 6 of 7 runs from how it set browser storage (an init script; Chromium 153 sometimes gives such a tab a storage area of its own), on v2.11 as often, never the board; fixed in the check at 3e29863 (tools/pmo-save.mjs only), it passes 12 of 12 on v2.12 and 4 of 4 on v2.11 and still fails on six v2.09 save mutants and on 9bc5496, ba3c294 and d3ce17d (recovery/v212/notes-pmosave.md).
  npm run validate:nightly on d630240 (13:11-14:02 UTC, 51 min): every stage holds but the browser stage, which fails only on layout D x8, carried since v2.00; fuzz seed 374193428. The first run, on 85c1017, failed audit-import's guide-size check alone (trimmed at d630240). The 364 v2.12 mutations (350 new v212-*, 14 older ones retargeted) on the final
  board (recovery/v212/proved-INT.jsonl): 364 of 364 CAUGHT; the first run caught 361, and the 3 that survived were caught once their checks reached them (e665914, b8420fc). Five of the older retargets (fydp-service-shifted,
  v199-newreq-ccar-cut, v200-u41-strip-silent, v207-rv2-wbs-mark-off-early, v207-rv2-wbs-mark-never-off) were made by W2
  with no proof; the lead proved them at integration, all caught (recovery/v212/proofs-retarget.json). A retarget is a new
  mutation and needs its own proof.
- Known risks, blocked checks and reviewer findings: two reviews, two skeptics per finding, a finding kept when a finder
  reproduced it and at least one skeptic held it. The first kept 56 (R00-R37 in review-W1W3.json, K00-K17 in
  review-W2int.json) and refuted 5, fixed by RV1-RV3; the second kept 22 (S00-S21 in review-round2.json) and refuted 5,
  fixed by RV4-RV6. Every kept finding went to a fixer, and none is recorded as not fixed. In NEXT-VERSION.md › Shipped ›
  v2.12: the eight questions for Brad; the decisions made in the build, by the builders and by the lead (the lead's each
  one Brad can reverse, three of them raised by a reviewer and refuted as the rule asked for); and what was left as found.
  The guide has 50 characters of room (69,950 as audit-import reads it, under 70,000; trimmed at d630240 after the first nightly failed there): the next addition must trim it or
  raise the budget on purpose. Checks that stand in or cannot reach: keyboard T stands in for a datalist pick (automated
  Chromium does not open one from the keys); layout Q's long WBS names are invented (the 2026 estimate's real names were
  not seen); RV4's tiebreak between two breakout parents (the first in code order) has no mutation, as no fixture builds
  one; a few lines are left unmutated as equivalent, each named in its notes; pmosave's one failure during the build (G, notes-RV2.md) fits
  the same storage race in the check, fixed at 3e29863. Another appropriation's stored budget caches are live only once its board opens
  (notes-W3.md). Layout D ×8 is carried; the sweep was not run (Brad's rule of 20 Oct).
- Brad's integration/merge/publication authorization, if given: "Merge" (Brad, 2 Nov 2026 00:14 UTC, in the lead session); the lead merged PR #30 on it.

The four recurring monitors retain read-only scope.

## Assignment template

- Task and approved scope:
- Owner and outgoing owner's explicit stopped status:
- Allowed files and excluded scope:
- Isolated branch and base commit SHA:
- Status: assigned / editing / ready for review / returned for fixes / accepted / closed
- Required bounded checks and designated gate owner:
- Handoff commit SHA and changed files:
- Commands, seeds, durations, exit statuses and results:
- Known risks, blocked checks and reviewer findings:
- Brad's integration/merge/publication authorization, if given:

## Message to paste into both sessions

> Read AGENTS.md, CLAUDE.md and WORK-ASSIGNMENTS.md. Work only on Brad's explicitly assigned scope in an isolated branch. One editing agent at a time, including tests. Do not assume another session has stopped. Hand off an exact commit SHA, changes, actual validation results and unresolved risks. If ownership is unclear, continue read-only work and ask Brad before edits. Recurring monitors remain read-only.
