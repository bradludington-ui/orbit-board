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

- Task and approved scope: v2.15 -- the second of the three versions Brad approved on 3 Nov 2026 ("Let's push all of these",
  "Three versions, data loss first", "Accept all recommendations", "Go"): items 137 (the context bar never wraps), 138 (a package
  keeps the receiving board's PPBE cycle), 139 (retag moves every appropriation that has locked the cycle), 142 (the requirement
  list follows the copy that opens), 143 (Save records every appropriation it wrote), 144 (the other direct storage writes go
  through lsSet), 145 (two tabs of one browser on one appropriation), 146 (found building and reviewing v2.14), and the small
  fixes: item 131 (folder reads, house indents, the FYDP Disconnects box across tabs), item 135's four gaps, v2.12's question 1,
  the guide's five-year text, the Priority Drill's narrow columns, the five-year workbook's "Allocated" renamed Funded.
  `recovery/v215/contract.md` decides. Next: v2.16 (item 133).
- Owner and outgoing owner's explicit stopped status: Claude (Claude Code session on ccr-aef4e698-poiml3). v2.14's lead stopped
  at its merge (PR #34, 8413a7b). Helpers: four builders W1-W4, each in its own worktree on its own branch from the slot commit
  8c24ea2 (merged as 96d3944, bb6179f, ccfff04, a72a6bc); four reviewers and their skeptics (read only); four fixers RV-A to RV-D,
  each on its own branch from dbfc7c4 (merged as 5a95ad8, 2108675, b0ff163, 14f2672). Each stopped at its report. Claude stops
  edits at the handoff commit.
- Allowed files and excluded scope: prioritization-board-grid.html, tools/**, NEXT-VERSION.md, CLAUDE.md, AGENTS.md,
  recovery/v215/**, this entry. Excluded: item 133 (v2.16), items 100 and 107 (Brad: leave until hosting is chosen), E1 (Brad:
  "Not needed this week"), item 135's four "Brad's call" items and item 131's "why lines print —" (not chosen).
- Isolated branch and base commit SHA: ccr-aef4e698-poiml3, from main 8413a7b.
- Status: ready for review. Built on ccr-aef4e698-poiml3; awaiting Brad's merge. Not merged.
- Required bounded checks and designated gate owner: npm run check; every suite whole; the browser checks (verify:grid, keys,
  dropdowns, dialogs, leftmenu, pmosave, pmoyears, pointer, savetarget, fileimport, storagefull, standards); each new and
  retargeted mutation proved against its own check; mcount; review with skeptics; validate:nightly on the final tree. Gate owner
  Claude. No sweep without Brad's named go.
- Handoff commit SHA and changed files: the commit that carries this entry (the PR names the head). The board (BUILD
  'v2.15 (9 Nov 2026)', e1162da); .gitignore (a node_modules link a builder's worktree committed was dropped, 0da3813, and the link
  form ignored, 178e9d8); tools/export-audit/{audit-board,audit-import,audit-inject,audit-other,audit-recon,mutate}.mjs;
  tools/{import-file,keyboard-reach,layout-fits,left-menu,money-coverage,save-target,standards-check,toolbar-fits,trace-lib}.mjs,
  tools/money-map.{json,md}; NEXT-VERSION.md, CLAUDE.md, this entry; recovery/v215/ (contract, notes, proofs and proof records).
- Commands, seeds, durations, exit statuses and results: each builder and fixer ran every suite whole on its finished board
  (8 GB heap, one at a time through recovery/v215/bin/heavy.sh) and the browser checks it touched. Mutations: 193 new, 60
  retargets, v209-rv3-save-look-record-left marked equivalent; 3,800 targets, each once. The builders' 200 proved together on the
  merged board, 200 of 200 CAUGHT (recovery/v215/proved-INT.jsonl); the review's 54 together on the final tree: see
  proved-RVALL.jsonl. 54 of 54 CAUGHT, none by a block that threw. The final gate: <<GATE RESULTS>>
- Known risks, blocked checks and reviewer findings: the review's 14 findings (A1, A2, B1-B4, C1-C5, D1-D3) were all confirmed by a
  skeptic, seven narrower than reported (A2, B3, B4, C1, C2, C4, D1) and one part of C1 refuted; all are fixed, with checks. A2's wider case (an ordinary save()
  writing over another tab's copy) predates v2.15 and was left. What the builders and fixers left is item 147 in NEXT-VERSION.md;
  item 146's remainder stays open. Layout D x8 is carried; the sweep was not run (Brad's rule of 20 Oct).
- Brad's integration/merge/publication authorization, if given: not given for v2.15. Each version merges on Brad's word.

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
