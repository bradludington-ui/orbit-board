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
  by its header titles; PSM inside Air Vehicle; the Spend Plan Source carries the WBS; the FYDP Spend Plan's STOVL tab) and
  134 (every year's budget authority read live from the PPBE position assigned; over and under flagged, no automatic cut;
  unallocated added funding shown as UPL, the last line), as logged in NEXT-VERSION.md with Brad's answers of 28 Oct
  (Brad, 28 Oct: "Go on v2.12"). Item 133 (the Service share workbook) is v2.13 and not in scope.
- Owner and outgoing owner's explicit stopped status: Claude (Claude Code session on ccr-0b15d8d5-ypf61n), with three
  builders (W1, W2, W3) on branches v212-w1/-w2/-w3 per recovery/v212/contract.md. v2.11 is merged (PR #29, bbb7ee9).
- Allowed files and excluded scope: prioritization-board-grid.html, tools/**, package.json, NEXT-VERSION.md, CLAUDE.md,
  AGENTS.md, math-defects.json, recovery/v212/** and this entry. Excluded: the sweep (no named go), item 133, items 100
  and 107.
- Isolated branch and base commit SHA: ccr-0b15d8d5-ypf61n, based on main bbb7ee9 (v2.11) plus the item 132-134 logging.
- Status: editing.
- Required bounded checks and designated gate owner: npm run check; every suite; the browser checks (verify:grid, keys,
  dropdowns, dialogs, leftmenu, pmosave, pmoyears, pointer, standards); each new mutation proved with
  recovery/v208/bin/prove.py; mcount; review with skeptics; validate:nightly on the final tree. Gate owner Claude. No sweep.
- Handoff commit SHA and changed files: given at the PR (#30).
- Known risks, blocked checks and reviewer findings: listed in NEXT-VERSION.md under v2.12 at the PR.
- Brad's integration/merge/publication authorization, if given: not given. Nothing merges without Brad's go.

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
