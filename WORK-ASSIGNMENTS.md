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

- Task and approved scope: v2.13 -- item 136 (one PPBE cycle for the whole board, chosen in the context bar), as logged in
  NEXT-VERSION.md with Brad's answers of 2 Nov 2026 ("Apply to all"; "Yes" to offering it on opening; "Deltas should bump against
  the controls I've entered for that cycle versus what's been allocated to each requirement"; "Separate comparison") and his
  "Go on item 136". Item 133 (the Service share workbook) is not in scope and stays under Open.
- Owner and outgoing owner's explicit stopped status: Claude (Claude Code session on ccr-26126337-csqb5v). Helpers: five map readers
  and a completeness critic (read only), one browser-check builder in a worktree (worktree-agent-ae76f8d41faa8a9a2; its check commit
  a07eac6 was taken as 608c8c1, its board fix 1f5b0e3 was not taken: the bar keeps its last figure instead), four reviewers and their
  skeptics (read only). Each stopped at its report. Claude stops edits at the handoff commit.
- Allowed files and excluded scope: prioritization-board-grid.html, tools/**, NEXT-VERSION.md, CLAUDE.md, recovery/v213/**, this
  entry. Excluded: the sweep (no named go), item 133, items 100 and 107.
- Isolated branch and base commit SHA: ccr-26126337-csqb5v, based on main fe0c83d (v2.12 merged), plus the item 136 logging
  (67e758d .. efd6435). Draft PR #32.
- Status: accepted; merged on Brad's "Merge when ready" (2 Nov 2026).
- Required bounded checks and designated gate owner: npm run check; every suite; the browser checks (verify:grid, keys, dropdowns,
  dialogs, leftmenu, pmosave, pmoyears, pointer, standards); each new and retargeted mutation proved against its own check; mcount;
  review with skeptics; validate:nightly on the final tree. Gate owner Claude. No sweep.
- Handoff commit SHA and changed files: the commit that carries this entry (the PR names the head). The board
  (BUILD 'v2.13 (2 Nov 2026)'); tools/export-audit/{audit-board,audit-recon,audit-import,mutate}.mjs; tools/{keyboard-reach,
  layout-fits,panels-render,standards-check,left-menu,ia-fixture,money-coverage}.mjs and the new tools/cyc-seed.mjs;
  NEXT-VERSION.md, CLAUDE.md, recovery/v213/ (proofs-136.json, proved-136.jsonl, proved-retarget-ui.jsonl).
- Commands, seeds, durations, exit statuses and results: every suite whole (8 banners and the legacy line). npm run validate:nightly
  (15:41-16:39 UTC, 58 min): every stage holds but the browser stage, which fails only on layout D x8, carried since v2.00; fuzz seed
  64422288; money map 322 cells (119 proven, 202 n/a, 1 open); coverage 27/27; trace matrix 77 cells. Browser checks after layout:
  keys, dropdowns (560 menus), dialogs, leftmenu, pmosave, pmoyears, pointer and standards (0 findings, nothing new) all pass. Mutations: 71 new, 6 retargeted, 3,220 targets each matching once; 75 of 75 proved CAUGHT
  (recovery/v213/proved-136.jsonl, proved-retarget-ui.jsonl).
- Known risks, blocked checks and reviewer findings: the completeness critic's eight gaps and the review's 20 kept findings (24
  reported; 4 refuted by both skeptics) are all fixed, with checks; none is recorded as not fixed. Four questions for Brad are in
  NEXT-VERSION.md > Shipped > v2.13 (packages replacing the cycle; the per-appropriation retags; the context bar wrapping to two lines
  below about 1,138 px on a tagged board; the shared folder moving only the board on screen). Another appropriation's stored budget
  follows the cycle when its board next opens (item 135). Layout D x8 is carried; the sweep was not run (Brad's rule of 20 Oct).
- Brad's integration/merge/publication authorization, if given: given, 2 Nov 2026: "Merge when ready". Merged into main as
  PR #32 with a merge commit, so the commits the suites read from history stay reachable.

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
